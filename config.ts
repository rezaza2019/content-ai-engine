import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const urlsFile = path.join(dataDir, "urls.json");
export const configLinksFile = path.join(dataDir, "config_links.json");

export const getUrls = () => {
  try {
    if (fs.existsSync(urlsFile)) {
      return JSON.parse(fs.readFileSync(urlsFile, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading urls file", e);
  }
  return [];
};

export const saveUrls = (urls: any[]) => {
  fs.writeFileSync(urlsFile, JSON.stringify(urls, null, 2));
};

export const getConfigLinks = () => {
  try {
    if (fs.existsSync(configLinksFile)) {
      return JSON.parse(fs.readFileSync(configLinksFile, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading config links file", e);
  }
  return [
    { id: 'pixabay', name: 'Pixabay', url: 'https://pixabay.com/images/search/{query}' },
    { id: 'tinyurl', name: 'TinyURL', url: 'https://tinyurl.com/api-create?url={url}' },
    { id: 'facebook', name: 'Facebook Studio', url: 'https://business.facebook.com/creatorstudio/' }
  ];
};

export const saveConfigLinks = (links: any[]) => {
  fs.writeFileSync(configLinksFile, JSON.stringify(links, null, 2));
};

export const CACHE_TTL = 1000 * 60 * 15; // 15 minutes
