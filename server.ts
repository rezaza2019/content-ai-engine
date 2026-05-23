import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import fs from "fs";
import multer from "multer";
import { getUrls, saveUrls, getConfigLinks, saveConfigLinks } from "./config";
import { getCachePaths, isCacheValid, serveFromCache, pipeToCache } from "./cache";



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

  const wpBaseUrl = (process.env.WP_BASE_URL || "https://api.takhfid.nl").replace(/\/$/, "");
  const wpRestBaseUrl = (
    process.env.WP_REST_BASE_URL || `${wpBaseUrl}/wp-json/wp/v2`
  ).replace(/\/$/, "");
  const wpPostTypes = {
    destinations: process.env.WP_DESTINATION_POST_TYPE || "destination",
    tickets: process.env.WP_TICKET_POST_TYPE || "ticket",
    deals: process.env.WP_DEAL_POST_TYPE || "deal",
    accommodations: process.env.WP_ACCOMMODATION_POST_TYPE || "accommodations",
    travelOffers: process.env.WP_TRAVEL_OFFER_POST_TYPE || "travel-offers",
  };

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

  const getWpField = (post: any, field: string) =>
    post?.acf?.[field] ?? post?.meta?.[field] ?? "";

  const normalizeWpDestination = (post: any) => ({
    id: post.id,
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    title: post.title,
    content: post.content,
    price: getWpField(post, "price"),
    duration: getWpField(post, "duration"),
    departure_date: getWpField(post, "departure_date"),
    aff_link: getWpField(post, "aff_link"),
    destination_name: getWpField(post, "destination_name"),
    destination_region: getWpField(post, "destination_region"),
    destination_country: getWpField(post, "destination_country"),
    imageUrl: post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
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
    acf: post.acf,
    meta: post.meta,
  });

  const buildDestinationPayload = (destination: any) => {
    const customFields = {
      price: destination.price ?? "",
      duration: destination.duration ?? "",
      departure_date: destination.departure_date ?? "",
      aff_link: destination.aff_link ?? "",
      destination_name: destination.destination_name ?? "",
      destination_region: destination.destination_region ?? "",
      destination_country: destination.destination_country ?? "",
    };

    const payload: any = {
      title: destination.title?.rendered ?? destination.title ?? "",
      content: destination.content?.rendered ?? destination.content ?? "",
      status: "publish",
      acf: customFields,
    };

    if (process.env.WP_WRITE_META === "true") {
      payload.meta = customFields;
    }

    return payload;
  };

  const buildAccommodationPayload = (accommodation: any) => {
    const customFields = {
      name: accommodation.name ?? "",
      country: accommodation.country ?? "",
      region: accommodation.region ?? "",
      city: accommodation.city ?? "",
      rating: accommodation.rating ?? "",
      review_count: accommodation.review_count ?? "",
      facilities: accommodation.facilities ?? [],
    };

    const payload: any = {
      title:
        accommodation.title?.rendered ??
        accommodation.title ??
        customFields.name ??
        "",
      content: accommodation.content?.rendered ?? accommodation.content ?? "",
      excerpt: accommodation.excerpt?.rendered ?? accommodation.excerpt ?? "",
      status: accommodation.status ?? "publish",
      acf: customFields,
    };

    if (process.env.WP_WRITE_META === "true") {
      payload.meta = customFields;
    }

    return payload;
  };

  const buildTravelOfferPayload = (offer: any) => {
    const customFields = {
      price_per_person_from: offer.price_per_person_from ?? "",
      duration_days: offer.duration_days ?? "",
      departure_date: offer.departure_date ?? "",
      departure_airport: offer.departure_airport ?? "",
      board_type: offer.board_type ?? "",
      transfer_included: offer.transfer_included ?? false,
      accommodation: offer.accommodation ?? null,
      destination_term: offer.destination_term ?? null,
    };

    const payload: any = {
      title: offer.title?.rendered ?? offer.title ?? "",
      excerpt: offer.excerpt?.rendered ?? offer.excerpt ?? "",
      status: offer.status ?? "publish",
      acf: customFields,
    };

    if (process.env.WP_WRITE_META === "true") {
      payload.meta = customFields;
    }

    return payload;
  };

  const wpRequest = async (pathName: string, init: any = {}) => {
    const upstreamUrl = `${wpRestBaseUrl}${pathName}`;
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
    const data = contentType.includes("application/json") && text ? JSON.parse(text) : text;

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
        hasCredentials: Boolean(process.env.WP_USERNAME && process.env.WP_APP_PASSWORD),
        responsePreview: text.slice(0, 500),
      });
    } catch (error) {
      res.status(502).json({
        wpBaseUrl,
        wpRestBaseUrl,
        hasCredentials: Boolean(process.env.WP_USERNAME && process.env.WP_APP_PASSWORD),
        error: error instanceof Error ? error.message : "Failed to reach WordPress REST API",
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
      const post = await wpRequest(`/${wpPostTypes.destinations}`, {
        method: "POST",
        body: JSON.stringify(buildDestinationPayload(req.body)),
      });
      res.json(normalizeWpDestination(post));
    } catch (error) {
      console.error("WordPress Create Destination Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to create WordPress destination",
      });
    }
  });

  app.put("/api/wp/destinations/:id", async (req, res) => {
    try {
      const post = await wpRequest(
        `/${wpPostTypes.destinations}/${req.params.id}`,
        {
          method: "POST",
          body: JSON.stringify(buildDestinationPayload(req.body)),
        },
      );
      res.json(normalizeWpDestination(post));
    } catch (error) {
      console.error("WordPress Update Destination Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to update WordPress destination",
      });
    }
  });

  app.delete("/api/wp/destinations/:id", async (req, res) => {
    try {
      const post = await wpRequest(
        `/${wpPostTypes.destinations}/${req.params.id}`,
        {
          method: "DELETE",
        },
      );
      res.json(post);
    } catch (error) {
      console.error("WordPress Delete Destination Error:", error);
      res.status(error instanceof WordPressRequestError ? error.status : 502).json({
        error: error instanceof Error ? error.message : "Failed to delete WordPress destination",
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
      const post = await wpRequest(`/${wpPostTypes.accommodations}`, {
        method: "POST",
        body: JSON.stringify(buildAccommodationPayload(req.body)),
      });
      res.json(normalizeWpAccommodation(post));
    } catch (error) {
      console.error("WordPress Create Accommodation Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to create WordPress accommodation",
      });
    }
  });

  app.put("/api/wp/accommodations/:id", async (req, res) => {
    try {
      const post = await wpRequest(
        `/${wpPostTypes.accommodations}/${req.params.id}`,
        {
          method: "POST",
          body: JSON.stringify(buildAccommodationPayload(req.body)),
        },
      );
      res.json(normalizeWpAccommodation(post));
    } catch (error) {
      console.error("WordPress Update Accommodation Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to update WordPress accommodation",
      });
    }
  });

  app.delete("/api/wp/accommodations/:id", async (req, res) => {
    try {
      const post = await wpRequest(
        `/${wpPostTypes.accommodations}/${req.params.id}`,
        {
          method: "DELETE",
        },
      );
      res.json(post);
    } catch (error) {
      console.error("WordPress Delete Accommodation Error:", error);
      res.status(error instanceof WordPressRequestError ? error.status : 502).json({
        error: error instanceof Error ? error.message : "Failed to delete WordPress accommodation",
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
      const post = await wpRequest(`/${wpPostTypes.travelOffers}`, {
        method: "POST",
        body: JSON.stringify(buildTravelOfferPayload(req.body)),
      });
      res.json(normalizeWpTravelOffer(post));
    } catch (error) {
      console.error("WordPress Create Travel Offer Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to create WordPress travel offer",
      });
    }
  });

  app.put("/api/wp/travel-offers/:id", async (req, res) => {
    try {
      const post = await wpRequest(
        `/${wpPostTypes.travelOffers}/${req.params.id}`,
        {
          method: "POST",
          body: JSON.stringify(buildTravelOfferPayload(req.body)),
        },
      );
      res.json(normalizeWpTravelOffer(post));
    } catch (error) {
      console.error("WordPress Update Travel Offer Error:", error);
      res.status(502).json({
        error: error instanceof Error ? error.message : "Failed to update WordPress travel offer",
      });
    }
  });

  app.delete("/api/wp/travel-offers/:id", async (req, res) => {
    try {
      const post = await wpRequest(
        `/${wpPostTypes.travelOffers}/${req.params.id}`,
        {
          method: "DELETE",
        },
      );
      res.json(post);
    } catch (error) {
      console.error("WordPress Delete Travel Offer Error:", error);
      res.status(error instanceof WordPressRequestError ? error.status : 502).json({
        error: error instanceof Error ? error.message : "Failed to delete WordPress travel offer",
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
