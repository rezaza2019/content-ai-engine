import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import fs from "fs";
import multer from "multer";
import { getUrls, saveUrls, getConfigLinks, saveConfigLinks } from "./config";
import { getCachePaths, isCacheValid, serveFromCache, pipeToCache } from "./cache";
import { mapTravelOfferImportFields } from "./src/utils/mapTravelOfferAcfFields.ts";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WordPressRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "WordPressRequestError";
    this.status = status;
  }
}

async function startServer() {
  const app = express();
  const PORT = 4000;

  app.use(express.json());

  const ADMIN_USERNAME = "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "content-ai-engine-dev-session-secret";
  const adminSessionTtlMs = 1000 * 60 * 60 * 12;
  const isLocalRequest = (req: express.Request) => {
    const host = (req.headers.host || "").split(":")[0];
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  };

  const parseCookies = (cookieHeader = "") =>
    Object.fromEntries(
      cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .filter(Boolean)
        .map((cookie) => {
          const separator = cookie.indexOf("=");
          if (separator === -1) return [cookie, ""];
          return [
            decodeURIComponent(cookie.slice(0, separator)),
            decodeURIComponent(cookie.slice(separator + 1)),
          ];
        }),
    );

  const signSession = (payload: string) =>
    crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");

  const createSessionToken = () => {
    const expiresAt = Date.now() + adminSessionTtlMs;
    const payload = `${ADMIN_USERNAME}.${expiresAt}`;
    return `${payload}.${signSession(payload)}`;
  };

  const isValidSessionToken = (token?: string) => {
    if (!token) return false;

    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [username, expiresAtRaw, signature] = parts;
    if (username !== ADMIN_USERNAME) return false;

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

    const expectedSignature = signSession(`${username}.${expiresAtRaw}`);
    if (signature.length !== expectedSignature.length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  };

  const isAdminAuthenticated = (req: express.Request) => {
    const cookies = parseCookies(req.headers.cookie);
    return isValidSessionToken(cookies.admin_session);
  };

  const adminCookieOptions = [
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${Math.floor(adminSessionTtlMs / 1000)}`,
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  app.get("/api/admin-auth/status", (req, res) => {
    res.json({
      authenticated: isAdminAuthenticated(req),
      username: isAdminAuthenticated(req) ? ADMIN_USERNAME : null,
    });
  });

  app.post("/api/admin-auth/login", (req, res) => {
    const { username, password } = req.body || {};

    if (isLocalRequest(req)) {
      return res.status(403).json({
        error:
          "Admin login is disabled on local development. Run the app in a production environment with ADMIN_PASSWORD configured to use admin login.",
      });
    }

    if (!adminPassword) {
      return res.status(503).json({
        error: "Admin login is not configured. Set ADMIN_PASSWORD in .env and restart the server.",
      });
    }

    if (username !== ADMIN_USERNAME || password !== adminPassword) {
      return res.status(401).json({ error: "Only the admin account can sign in." });
    }

    res.setHeader("Set-Cookie", `admin_session=${encodeURIComponent(createSessionToken())}; ${adminCookieOptions}`);
    res.json({ authenticated: true, username: ADMIN_USERNAME });
  });

  app.post("/api/admin-auth/logout", (req, res) => {
    res.setHeader("Set-Cookie", "admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
    res.json({ authenticated: false });
  });

  app.use("/api", (req, res, next) => {
    if (isLocalRequest(req)) {
      return next();
    }

    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: "Admin login required." });
    }

    next();
  });

  const wpBaseUrl = (process.env.WP_BASE_URL || "https://api.takhfid.nl").replace(/\/$/, "");
  const wpRestBaseUrl = (
    process.env.WP_REST_BASE_URL || `${wpBaseUrl}/wp-json/wp/v2`
  ).replace(/\/$/, "");
  const wpAcfRestBaseUrl = (
    process.env.WP_ACF_REST_BASE_URL ||
    wpRestBaseUrl.replace(/\/wp\/v2\/?$/, "/acf/v3")
  ).replace(/\/$/, "");
  const wpPostTypes = {
    destinations: process.env.WP_DESTINATION_POST_TYPE || "destination",
    tickets: process.env.WP_TICKET_POST_TYPE || "ticket",
    deals: process.env.WP_DEAL_POST_TYPE || "deal",
    accommodations: process.env.WP_ACCOMMODATION_POST_TYPE || "accommodations",
    travelOffers: process.env.WP_TRAVEL_OFFER_POST_TYPE || "travel-offers",
  };

  const hasWpCredentials = () =>
    Boolean(process.env.WP_USERNAME && process.env.WP_APP_PASSWORD);

  const WP_WRITE_CREDENTIALS_MESSAGE =
    "WordPress write credentials are not configured. Add WP_USERNAME and WP_APP_PASSWORD to .env (Application Password from WordPress: Users → Profile → Application Passwords), then restart the dev server.";

  const wpAuthHeader = () => {
    const username = process.env.WP_USERNAME;
    const password = process.env.WP_APP_PASSWORD;

    if (!username || !password) {
      return {};
    }

    return {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    };
  };

  const ensureWpWriteCredentials = () => {
    if (!hasWpCredentials()) {
      throw new WordPressRequestError(WP_WRITE_CREDENTIALS_MESSAGE, 401);
    }
  };

  const formatWpWriteError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "WordPress request failed.";

    if (message.includes("not allowed to create")) {
      return `${message} Use a WordPress user with Editor or Administrator role and a valid Application Password in WP_USERNAME / WP_APP_PASSWORD.`;
    }

    return message;
  };

  const wpWriteErrorStatus = (error: unknown) => {
    if (error instanceof WordPressRequestError) {
      if (error.status === 401 || error.status === 403) {
        return error.status;
      }

      if (error.message.includes("not allowed to create")) {
        return 403;
      }
    }

    return 502;
  };

  const getWpField = (post: any, field: string) =>
    post?.acf?.[field] ?? post?.meta?.[field] ?? "";

  const getDestinationPhotoUrl = (post: any) => {
    const photos = getWpField(post, "destination_photo");

    if (Array.isArray(photos) && photos.length > 0) {
      const first = photos[0];
      if (typeof first === "object" && first?.url) {
        return first.url;
      }
    }

    return post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";
  };

  const normalizeDestinationPhotoIds = (photos: unknown): number[] => {
    if (!Array.isArray(photos)) return [];

    return photos
      .map((photo) =>
        typeof photo === "number" ? photo : photo?.ID ?? photo?.id,
      )
      .filter((id) => id !== undefined && id !== null)
      .map(Number);
  };

  const normalizeWpDestination = (post: any) => ({
    id: post.id,
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    title: post.title,
    content: post.content,
    destination_name: getWpField(post, "destination_name"),
    destination_identifier: getWpField(post, "destination_identifier"),
    type_of_destination: getWpField(post, "type_of_destination"),
    destination_name_farsi: getWpField(post, "destination_name_farsi"),
    destination_region: getWpField(post, "destination_region"),
    destination_region_fa: getWpField(post, "destination_region_fa"),
    destination_country: getWpField(post, "destination_country"),
    destination_country_fa: getWpField(post, "destination_country_fa"),
    destination_photo: getWpField(post, "destination_photo") || [],
    destination_region_description_farsi: getWpField(
      post,
      "destination_region_description_farsi",
    ),
    imageUrl: getDestinationPhotoUrl(post),
    acf: post.acf,
  });

  const normalizeWpTicket = (post: any) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    status: post.status,
    link: post.link,
    imageUrl: post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
    trade_tracker_id: getWpField(post, "trade_tracker_id"),
    price: getWpField(post, "price"),
    old_price: getWpField(post, "old_price"),
    discount: getWpField(post, "discount"),
    acf: post.acf,
    meta: post.meta,
  });

  const normalizeWpDeal = (post: any) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    status: post.status,
    link: post.link,
    imageUrl: post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
    name: getWpField(post, "name"),
    discounted_price: getWpField(post, "discounted_price"),
    old_price: getWpField(post, "old_price"),
    where_to_buy: getWpField(post, "where_to_buy"),
    where_to_publish: getWpField(post, "where_to_publish"),
    acf: post.acf,
    meta: post.meta,
  });

  const normalizeWpAccommodation = (post: any) => ({
    id: post.id,
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    status: post.status,
    link: post.link,
    imageUrl: post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
    name: getWpField(post, "name"),
    country: getWpField(post, "country"),
    region: getWpField(post, "region"),
    city: getWpField(post, "city"),
    rating: getWpField(post, "rating"),
    review_count: getWpField(post, "review_count"),
    facilities: getWpField(post, "facilities"),
    acf: post.acf,
    meta: post.meta,
  });

  const normalizeWpTravelOffer = (post: any) => ({
    id: post.id,
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    title: post.title,
    excerpt: post.excerpt,
    status: post.status,
    link: post.link,
    imageUrl: post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
    price_per_person_from: getWpField(post, "price_per_person_from"),
    duration_days: getWpField(post, "duration_days"),
    departure_date: getWpField(post, "departure_date"),
    departure_airport: getWpField(post, "departure_airport"),
    board_type: getWpField(post, "board_type"),
    transfer_included: getWpField(post, "transfer_included"),
    accommodation: getWpField(post, "accommodation"),
    destination_term: getWpField(post, "destination_term"),
    affiliate_link: getWpField(post, "affiliate_link"),
    acf: post.acf,
    meta: post.meta,
  });

  const buildDestinationCustomFields = (destination: any) => {
    const destinationName =
      destination.destination_name ??
      destination.title?.rendered ??
      destination.title ??
      "";

    const customFields: Record<string, unknown> = {
      destination_name: destinationName,
      destination_identifier: destination.destination_identifier ?? "",
      type_of_destination: destination.type_of_destination ?? "",
      destination_name_farsi: destination.destination_name_farsi ?? "",
      destination_region: destination.destination_region ?? "",
      destination_region_fa: destination.destination_region_fa ?? "",
      destination_country: destination.destination_country ?? "",
      destination_country_fa: destination.destination_country_fa ?? "",
      destination_region_description_farsi:
        destination.destination_region_description_farsi ?? "",
    };

    const photoIds = normalizeDestinationPhotoIds(destination.destination_photo);
    if (photoIds.length > 0) {
      customFields.destination_photo = photoIds;
    }

    return customFields;
  };

  const buildDestinationCorePayload = (destination: any) => ({
    title: destination.title?.rendered ?? destination.title ?? "",
    content: destination.content?.rendered ?? destination.content ?? "",
    status: "publish",
  });

  const buildAccommodationCustomFields = (accommodation: any) => ({
    name: accommodation.name ?? "",
    country: accommodation.country ?? "",
    region: accommodation.region ?? "",
    city: accommodation.city ?? "",
    rating: accommodation.rating ?? null,
    review_count: accommodation.review_count ?? null,
    facilities: accommodation.facilities ?? [],
  });

  const buildAccommodationCorePayload = (accommodation: any) => {
    const customFields = buildAccommodationCustomFields(accommodation);

    return {
      title:
        accommodation.title?.rendered ??
        accommodation.title ??
        customFields.name ??
        "",
      content: accommodation.content?.rendered ?? accommodation.content ?? "",
      excerpt: accommodation.excerpt?.rendered ?? accommodation.excerpt ?? "",
      status: accommodation.status ?? "publish",
    };
  };

  const buildTravelOfferCustomFields = (offer: any) => {
    const customFields = mapTravelOfferImportFields({
      price_per_person_from: offer.price_per_person_from ?? null,
      duration_days: offer.duration_days ?? null,
      departure_date: offer.departure_date ?? null,
      departure_airport: offer.departure_airport ?? null,
      board_type: offer.board_type ?? null,
      transfer_included: offer.transfer_included ?? false,
      accommodation: offer.accommodation ?? null,
      destination_term: offer.destination_term ?? null,
    });

    if (offer.affiliate_link !== undefined) {
      customFields.affiliate_link = offer.affiliate_link ?? "";
    }

    return customFields;
  };

  const buildTravelOfferCorePayload = (offer: any) => ({
    title: offer.title?.rendered ?? offer.title ?? "",
    excerpt: offer.excerpt?.rendered ?? offer.excerpt ?? "",
    status: offer.status ?? "publish",
  });

  const normalizeDuplicateUrl = (value: unknown) => {
    if (!value) return "";

    const raw = String(value).trim();
    try {
      const url = new URL(raw);
      url.hash = "";
      return url.toString();
    } catch {
      return raw;
    }
  };

  const findTravelOfferByAffiliateLink = async (affiliateLinks: string[]) => {
    const targetUrls = new Set(
      affiliateLinks.map(normalizeDuplicateUrl).filter(Boolean),
    );
    if (targetUrls.size === 0) return null;

    const posts = await wpRequest(
      `/${wpPostTypes.travelOffers}?per_page=100&_embed=1`,
    );

    return posts
      .map(normalizeWpTravelOffer)
      .find(
        (offer: any) =>
          targetUrls.has(normalizeDuplicateUrl(offer.affiliate_link)),
      ) ?? null;
  };

  const wpRequestDelayMs = Math.max(
    0,
    Number(process.env.WP_REQUEST_DELAY_MS || 400),
  );
  const wpRequestMaxRetries = Math.max(
    0,
    Number(process.env.WP_REQUEST_MAX_RETRIES || 5),
  );

  let wpRequestQueue: Promise<void> = Promise.resolve();

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const scheduleWpRequest = async <T>(operation: () => Promise<T>) => {
    const run = wpRequestQueue.then(async () => {
      if (wpRequestDelayMs > 0) {
        await sleep(wpRequestDelayMs);
      }

      return operation();
    });

    wpRequestQueue = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  };

  const mergePostWithAcf = (post: any, acfResult: any, customFields: Record<string, unknown>) => ({
    ...post,
    acf: acfResult?.acf ?? customFields,
  });

  const wpJsonRequest = async (
    baseUrl: string,
    pathName: string,
    init: any = {},
  ) => {
    return scheduleWpRequest(async () => {
      const upstreamUrl = `${baseUrl}${pathName}`;

      for (let attempt = 0; attempt <= wpRequestMaxRetries; attempt += 1) {
        if (attempt > 0) {
          await sleep(Math.min(30000, 1500 * 2 ** (attempt - 1)));
        }

        const response = await fetch(upstreamUrl, {
          ...init,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...wpAuthHeader(),
            ...(init.headers || {}),
          },
        });

        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();
        const data =
          contentType.includes("application/json") && text
            ? JSON.parse(text)
            : text;

        if (response.status === 429 || response.status === 503) {
          if (attempt < wpRequestMaxRetries) {
            const retryAfterHeader = Number(response.headers.get("retry-after") || 0);
            if (retryAfterHeader > 0) {
              await sleep(retryAfterHeader * 1000);
            }
            continue;
          }

          throw new WordPressRequestError(
            "WordPress rate limit reached (429). The import sent too many requests. Wait a minute and try again, or increase WP_REQUEST_DELAY_MS in .env.",
            response.status,
          );
        }

        if (!response.ok) {
          throw new WordPressRequestError(
            typeof data === "string"
              ? `WordPress request failed with ${response.status}: ${data.slice(0, 500)}`
              : data?.message || `WordPress request failed with ${response.status}`,
            response.status,
          );
        }

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Expected WordPress JSON from ${upstreamUrl} but received ${contentType || "unknown content type"}. Response starts with: ${text.slice(0, 160)}`,
          );
        }

        return data;
      }

      throw new WordPressRequestError(
        "WordPress request failed after retries.",
        429,
      );
    });
  };

  const wpRequest = async (pathName: string, init: any = {}) =>
    wpJsonRequest(wpRestBaseUrl, pathName, init);

  const wpAcfRequest = async (pathName: string, init: any = {}) =>
    wpJsonRequest(wpAcfRestBaseUrl, pathName, init);

  const writeWpCustomFields = async (
    postId: number | string,
    customFields: Record<string, unknown>,
  ) => {
    const fields = Object.fromEntries(
      Object.entries(customFields).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(fields).length === 0) {
      return null;
    }

    return wpAcfRequest(`/posts/${postId}`, {
      method: "POST",
      body: JSON.stringify({ fields }),
    });
  };

  const createWpPostWithCustomFields = async (
    postType: string,
    corePayload: Record<string, unknown>,
    customFields: Record<string, unknown>,
  ) => {
    const created = await wpRequest(`/${postType}`, {
      method: "POST",
      body: JSON.stringify(corePayload),
    });

    if (Object.keys(customFields).length === 0) {
      return created;
    }

    try {
      const acfResult = await writeWpCustomFields(created.id, customFields);
      return mergePostWithAcf(created, acfResult, customFields);
    } catch (error) {
      throw new WordPressRequestError(
        `Post created (id ${created.id}) but custom fields failed: ${formatWpWriteError(error)}`,
        error instanceof WordPressRequestError ? error.status : 502,
      );
    }
  };

  const updateWpPostWithCustomFields = async (
    postType: string,
    postId: string,
    corePayload: Record<string, unknown>,
    customFields: Record<string, unknown>,
  ) => {
    const post = await wpRequest(`/${postType}/${postId}`, {
      method: "POST",
      body: JSON.stringify(corePayload),
    });

    if (Object.keys(customFields).length === 0) {
      return post;
    }

    const acfResult = await writeWpCustomFields(postId, customFields);
    return mergePostWithAcf(post, acfResult, customFields);
  };

  const normalizeMatchText = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const getPlainTitle = (post: any) => {
    const title =
      typeof post?.title === "object" ? post.title?.rendered : post?.title;

    return String(title ?? "").replace(/<[^>]*>/g, "");
  };

  const findAccommodationForParsedOffer = async (parsed: any) => {
    const targetName = normalizeMatchText(parsed.accommodationName);
    const targetCountry = normalizeMatchText(parsed.country);
    const targetCity = normalizeMatchText(parsed.city);

    const posts = await wpRequest(
      `/${wpPostTypes.accommodations}?per_page=100&_embed=1`,
    );

    return posts
      .map(normalizeWpAccommodation)
      .find((accommodation: any) => {
        const name = normalizeMatchText(
          accommodation.name || getPlainTitle(accommodation),
        );
        const country = normalizeMatchText(accommodation.country);
        const city = normalizeMatchText(accommodation.city);

        if (name !== targetName) return false;
        if (targetCountry && country !== targetCountry) return false;
        if (targetCity && city !== targetCity) return false;
        return true;
      }) ?? null;
  };

  const findOrCreateAccommodationForParsedOffer = async (parsed: any) => {
    const existing = await findAccommodationForParsedOffer(parsed);
    if (existing?.id) {
      return { accommodation: existing, created: false };
    }

    const accommodationPayload = {
      title: parsed.accommodationName,
      name: parsed.accommodationName,
      country: parsed.country,
      region: parsed.region,
      city: parsed.city,
      status: "publish",
    };

    const created = await createWpPostWithCustomFields(
      wpPostTypes.accommodations,
      buildAccommodationCorePayload(accommodationPayload),
      buildAccommodationCustomFields(accommodationPayload),
    );

    return { accommodation: normalizeWpAccommodation(created), created: true };
  };


  app.get("/api/urls", (req, res) => {
    res.json(getUrls());
  });

  app.post("/api/urls", (req, res) => {
    const urls = getUrls();
    const newUrl = { id: Date.now().toString(), ...req.body };
    urls.push(newUrl);
    saveUrls(urls);
    res.json(newUrl);
  });

  app.delete("/api/urls/:id", (req, res) => {
    let urls = getUrls();
    urls = urls.filter((u: any) => u.id !== req.params.id);
    saveUrls(urls);
    res.json({ success: true });
  });

  app.put("/api/urls/:id", (req, res) => {
    const urls = getUrls();
    const index = urls.findIndex((u: any) => u.id === req.params.id);
    if (index !== -1) {
      urls[index] = { ...urls[index], ...req.body };
      saveUrls(urls);
      res.json(urls[index]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });


  app.get("/api/config-links", (req, res) => {
    res.json(getConfigLinks());
  });

  app.post("/api/config-links", (req, res) => {
    saveConfigLinks(req.body);
    res.json({ success: true });
  });

  app.get("/api/wp/rest-index", async (req, res) => {
    try {
      res.json(await wpRequest("/"));
    } catch (error) {
      console.error("WordPress REST Index Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to fetch WordPress REST index",
      });
    }
  });

  app.get("/api/wp/diagnostics", async (req, res) => {
    try {
      const response = await fetch(`${wpRestBaseUrl}/`, {
        headers: {
          Accept: "application/json",
          ...wpAuthHeader(),
        },
      });
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      res.status(response.ok && contentType.includes("application/json") ? 200 : 502).json({
        wpBaseUrl,
        wpRestBaseUrl,
        status: response.status,
        contentType,
        isJson: contentType.includes("application/json"),
        hasCredentials: hasWpCredentials(),
        responsePreview: text.slice(0, 500),
      });
    } catch (error) {
      res.status(502).json({
        wpBaseUrl,
        wpRestBaseUrl,
        hasCredentials: hasWpCredentials(),
        error: error instanceof Error ? error.message : "Failed to reach WordPress REST API",
      });
    }
  });

  app.get("/api/wp/auth-status", async (req, res) => {
    if (!hasWpCredentials()) {
      return res.json({
        hasCredentials: false,
        canWrite: false,
        message: WP_WRITE_CREDENTIALS_MESSAGE,
      });
    }

    try {
      const user = await wpRequest("/users/me?context=edit");
      const roles: string[] = user.roles || [];
      const canWrite = roles.some((role) =>
        ["administrator", "editor", "author"].includes(role),
      );

      res.json({
        hasCredentials: true,
        canWrite,
        roles,
        username: user.slug || user.name,
        message: canWrite
          ? null
          : `WordPress user "${user.name}" cannot create posts. Use an Editor or Administrator account.`,
      });
    } catch (error) {
      res.status(401).json({
        hasCredentials: true,
        canWrite: false,
        message: formatWpWriteError(error),
      });
    }
  });

  app.get("/api/wp/destinations", async (req, res) => {
    try {
      const posts = await wpRequest(
        `/${wpPostTypes.destinations}?per_page=100&_embed=1`,
      );
      res.json(posts.map(normalizeWpDestination));
    } catch (error) {
      console.error("WordPress Destinations Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to fetch WordPress destinations",
      });
    }
  });

  app.post("/api/wp/destinations", async (req, res) => {
    try {
      ensureWpWriteCredentials();
      const post = await createWpPostWithCustomFields(
        wpPostTypes.destinations,
        buildDestinationCorePayload(req.body),
        buildDestinationCustomFields(req.body),
      );
      res.json(normalizeWpDestination(post));
    } catch (error) {
      console.error("WordPress Create Destination Error:", error);
      res.status(wpWriteErrorStatus(error)).json({
        error: formatWpWriteError(error),
      });
    }
  });

  app.put("/api/wp/destinations/:id", async (req, res) => {
    try {
      ensureWpWriteCredentials();
      const post = await updateWpPostWithCustomFields(
        wpPostTypes.destinations,
        req.params.id,
        buildDestinationCorePayload(req.body),
        buildDestinationCustomFields(req.body),
      );
      res.json(normalizeWpDestination(post));
    } catch (error) {
      console.error("WordPress Update Destination Error:", error);
      res.status(wpWriteErrorStatus(error)).json({
        error: formatWpWriteError(error),
      });
    }
  });

  app.delete("/api/wp/destinations/:id", async (req, res) => {
    try {
      ensureWpWriteCredentials();
      const post = await wpRequest(
        `/${wpPostTypes.destinations}/${req.params.id}`,
        {
          method: "DELETE",
        },
      );
      res.json(post);
    } catch (error) {
      console.error("WordPress Delete Destination Error:", error);
      res.status(wpWriteErrorStatus(error)).json({
        error: formatWpWriteError(error),
      });
    }
  });

  app.get("/api/wp/tickets", async (req, res) => {
    try {
      const posts = await wpRequest(
        `/${wpPostTypes.tickets}?per_page=100&_embed=1`,
      );
      res.json(posts.map(normalizeWpTicket));
    } catch (error) {
      console.error("WordPress Tickets Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to fetch WordPress tickets",
      });
    }
  });

  app.get("/api/wp/deals", async (req, res) => {
    try {
      const posts = await wpRequest(
        `/${wpPostTypes.deals}?per_page=100&_embed=1`,
      );
      res.json(posts.map(normalizeWpDeal));
    } catch (error) {
      console.error("WordPress Deals Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to fetch WordPress deals",
      });
    }
  });

  app.get("/api/wp/accommodations", async (req, res) => {
    try {
      const posts = await wpRequest(
        `/${wpPostTypes.accommodations}?per_page=100&_embed=1`,
      );
      res.json(posts.map(normalizeWpAccommodation));
    } catch (error) {
      console.error("WordPress Accommodations Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to fetch WordPress accommodations",
      });
    }
  });

  app.post("/api/wp/accommodations", async (req, res) => {
    try {
      ensureWpWriteCredentials();
      const post = await createWpPostWithCustomFields(
        wpPostTypes.accommodations,
        buildAccommodationCorePayload(req.body),
        buildAccommodationCustomFields(req.body),
      );
      res.json(normalizeWpAccommodation(post));
    } catch (error) {
      console.error("WordPress Create Accommodation Error:", error);
      res.status(wpWriteErrorStatus(error)).json({
        error: formatWpWriteError(error),
      });
    }
  });

  app.put("/api/wp/accommodations/:id", async (req, res) => {
    try {
      ensureWpWriteCredentials();
      const post = await updateWpPostWithCustomFields(
        wpPostTypes.accommodations,
        req.params.id,
        buildAccommodationCorePayload(req.body),
        buildAccommodationCustomFields(req.body),
      );
      res.json(normalizeWpAccommodation(post));
    } catch (error) {
      console.error("WordPress Update Accommodation Error:", error);
      res.status(wpWriteErrorStatus(error)).json({
        error: formatWpWriteError(error),
      });
    }
  });

  app.delete("/api/wp/accommodations/:id", async (req, res) => {
    try {
      ensureWpWriteCredentials();
      const post = await wpRequest(
        `/${wpPostTypes.accommodations}/${req.params.id}`,
        {
          method: "DELETE",
        },
      );
      res.json(post);
    } catch (error) {
      console.error("WordPress Delete Accommodation Error:", error);
      res.status(wpWriteErrorStatus(error)).json({
        error: formatWpWriteError(error),
      });
    }
  });

  app.get("/api/wp/travel-offers", async (req, res) => {
    try {
      const posts = await wpRequest(
        `/${wpPostTypes.travelOffers}?per_page=100&_embed=1`,
      );
      res.json(posts.map(normalizeWpTravelOffer));
    } catch (error) {
      console.error("WordPress Travel Offers Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to fetch WordPress travel offers",
      });
    }
  });

  app.post("/api/wp/travel-offers", async (req, res) => {
    try {
      ensureWpWriteCredentials();
      const post = await createWpPostWithCustomFields(
        wpPostTypes.travelOffers,
        buildTravelOfferCorePayload(req.body),
        buildTravelOfferCustomFields(req.body),
      );
      res.json(normalizeWpTravelOffer(post));
    } catch (error) {
      console.error("WordPress Create Travel Offer Error:", error);
      res.status(wpWriteErrorStatus(error)).json({
        error: formatWpWriteError(error),
      });
    }
  });

  app.put("/api/wp/travel-offers/:id", async (req, res) => {
    try {
      ensureWpWriteCredentials();
      const post = await updateWpPostWithCustomFields(
        wpPostTypes.travelOffers,
        req.params.id,
        buildTravelOfferCorePayload(req.body),
        buildTravelOfferCustomFields(req.body),
      );
      res.json(normalizeWpTravelOffer(post));
    } catch (error) {
      console.error("WordPress Update Travel Offer Error:", error);
      res.status(wpWriteErrorStatus(error)).json({
        error: formatWpWriteError(error),
      });
    }
  });

  app.delete("/api/wp/travel-offers/:id", async (req, res) => {
    try {
      ensureWpWriteCredentials();
      const post = await wpRequest(
        `/${wpPostTypes.travelOffers}/${req.params.id}`,
        {
          method: "DELETE",
        },
      );
      res.json(post);
    } catch (error) {
      console.error("WordPress Delete Travel Offer Error:", error);
      res.status(wpWriteErrorStatus(error)).json({
        error: formatWpWriteError(error),
      });
    }
  });

  app.post("/api/wp/travel-offers/parse-url", async (req, res) => {
    try {
      const { url, createPost, pricePerPersonFrom, durationDays } = req.body || {};

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const { createAffiliateLink, parseTravelOfferUrl } = await import(
        "./src/utils/parseTravelOfferUrl.ts"
      );
      const parsed = parseTravelOfferUrl(url);

      if (!parsed) {
        return res.status(400).json({
          error:
            "Failed to parse URL. Ensure it matches the expected format: https://domain/country/region/city/accommodation?boardingtype=AI&departuredate=YYYY-MM-DD",
        });
      }

      let result: any = {
        parsed,
        postId: null,
        created: false,
        updated: false,
        duplicate: false,
        existingPostId: null,
        accommodationId: null,
        accommodationExists: false,
        accommodationCreated: false,
      };

      const affiliateLink = createAffiliateLink(parsed.sourceUrl);
      const existingOffer = await findTravelOfferByAffiliateLink([
        affiliateLink,
        parsed.sourceUrl,
      ]);
      if (existingOffer) {
        result.duplicate = true;
        result.existingPostId = existingOffer.id;

        if (createPost) {
          return res.status(409).json({
            ...result,
            error: `A travel offer already exists for this URL. Existing post ID: ${existingOffer.id}.`,
          });
        }
      }

      const existingAccommodation = await findAccommodationForParsedOffer(parsed);
      if (existingAccommodation?.id) {
        result.accommodationId = Number(existingAccommodation.id);
        result.accommodationExists = true;
      }

      if (createPost) {
        try {
          ensureWpWriteCredentials();

          const { accommodation, created: accommodationCreated } =
            await findOrCreateAccommodationForParsedOffer(parsed);

          result.accommodationId = Number(accommodation.id);
          result.accommodationExists = !accommodationCreated;
          result.accommodationCreated = accommodationCreated;

          const boardingTypeLabel: Record<string, string> = {
            AI: "All Inclusive",
            HB: "Half Board",
            BB: "Bed & Breakfast",
            RO: "Room Only",
            FB: "Full Board",
          };

          const payload = {
            title: parsed.accommodationName,
            content: `Travel offer for ${parsed.accommodationName} in ${parsed.city}, ${parsed.region}. Boarding type: ${boardingTypeLabel[parsed.boardingType] || parsed.boardingType}. Departure date: ${parsed.departureDate}.`,
            status: "publish",
            price_per_person_from: pricePerPersonFrom || null,
            duration_days: durationDays || null,
            board_type: boardingTypeLabel[parsed.boardingType] || parsed.boardingType,
            departure_date: parsed.departureDate,
            departure_airport: parsed.departureAirports.join(", "),
            accommodation: accommodation.id,
            destination_term: `${parsed.city}, ${parsed.region}, ${parsed.country}`,
            affiliate_link: affiliateLink,
          };

          const post = await createWpPostWithCustomFields(
            wpPostTypes.travelOffers,
            buildTravelOfferCorePayload(payload),
            buildTravelOfferCustomFields(payload),
          );

          result.postId = post.id;
          result.created = true;
        } catch (error) {
          console.error("Failed to create travel offer post:", error);
          result.createError = formatWpWriteError(error);
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Parse Travel Offer URL Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to parse URL",
      });
    }
  });


  // API Route for the Daisycon feed
  app.get("/api/feed", async (req, res) => {
    const urlId = req.query.urlId as string;
    let feedUrl = "https://daisycon.io/datafeed/?media_id=263320&standard_id=18&language_code=nl&locale_id=1&type=JSON&program_id=7805&html_transform=none&rawdata=true&encoding=utf8&general=false";

    if (urlId) {
      const urls = getUrls();
      const found = urls.find((u: any) => u.id === urlId);
      if (found) {
        feedUrl = found.url;
      }
    }

    try {
      const { cachePath, tempPath } = getCachePaths(feedUrl);

      if (isCacheValid(cachePath)) {
        return serveFromCache(cachePath, res);
      }

      console.log(`Fetching datafeed from: ${feedUrl}`);
      const response = await fetch(feedUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch from external API: ${response.statusText}`);
      }

      pipeToCache(response.body, cachePath, tempPath, res);

    } catch (error) {
      console.error("Feed Proxy Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to fetch datafeed" });
      }
    }
  });

  // Image download endpoint
  app.post("/api/regions/image", async (req, res) => {
    const { imageUrl, countryName, regionName } = req.body;
    if (!imageUrl || !countryName || !regionName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const dir = path.join(process.cwd(), "public", "images", "regions", countryName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const fileName = `${regionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      const filePath = path.join(dir, fileName);

      console.log(`Downloading region image from ${imageUrl} to ${filePath}`);
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to download image");

      const fileStream = fs.createWriteStream(filePath);
      response.body.pipe(fileStream);

      fileStream.on("finish", () => {
        res.json({ success: true, path: `/images/regions/${countryName}/${fileName}` });
      });
    } catch (error) {
      console.error("Image Download Error:", error);
      res.status(500).json({ error: "Failed to download image" });
    }
  });

  // File upload configuration
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const { countryName } = req.body;
        const dir = path.join(process.cwd(), "public", "images", "regions", countryName);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const { regionName } = req.body;
        const fileName = `${regionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
        cb(null, fileName);
      }
    })
  });

  app.post("/api/regions/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ success: true, path: `/images/regions/${req.body.countryName}/${req.file.filename}` });
  });

  // List available region images
  app.get("/api/regions/images", (req, res) => {
    const baseDir = path.join(process.cwd(), "public", "images", "regions");
    const result: Record<string, string[]> = {};

    if (fs.existsSync(baseDir)) {
      const countries = fs.readdirSync(baseDir);
      for (const country of countries) {
        const countryPath = path.join(baseDir, country);
        if (fs.statSync(countryPath).isDirectory()) {
          result[country] = fs.readdirSync(countryPath);
        }
      }
    }
    res.json(result);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
