"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var VisualResourcesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualResourcesService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let VisualResourcesService = VisualResourcesService_1 = class VisualResourcesService {
    logger = new common_1.Logger(VisualResourcesService_1.name);
    async search(query) {
        const cleanQuery = query.replace(/[^\w\s-]/gi, '').trim();
        if (!cleanQuery)
            return null;
        try {
            this.logger.log(`Searching Wikimedia Commons for: "${cleanQuery}"`);
            const response = await axios_1.default.get('https://commons.wikimedia.org/w/api.php', {
                params: {
                    action: 'query',
                    format: 'json',
                    generator: 'search',
                    gsrnamespace: 6,
                    gsrsearch: cleanQuery + ' filetype:bitmap|drawing',
                    gsrlimit: 3,
                    prop: 'imageinfo',
                    iiprop: 'url|extmetadata',
                    origin: '*'
                },
                headers: {
                    'User-Agent': 'MentoraBot/1.0 (https://github.com/Mentora; mentora@example.com)'
                },
                timeout: 5000
            });
            const pages = response.data?.query?.pages;
            if (!pages) {
                this.logger.debug(`No images found for query: ${cleanQuery}`);
                return null;
            }
            for (const pageId in pages) {
                const page = pages[pageId];
                if (page.imageinfo && page.imageinfo.length > 0) {
                    const info = page.imageinfo[0];
                    const extMeta = info.extmetadata || {};
                    const title = page.title || '';
                    if (!title.toLowerCase().endsWith('.jpg') &&
                        !title.toLowerCase().endsWith('.jpeg') &&
                        !title.toLowerCase().endsWith('.png') &&
                        !title.toLowerCase().endsWith('.svg') &&
                        !title.toLowerCase().endsWith('.webp')) {
                        continue;
                    }
                    const url = info.url;
                    const description = extMeta.ObjectName?.value || extMeta.ImageDescription?.value || title.replace('File:', '').replace(/\.[^/.]+$/, '');
                    const artist = extMeta.Artist?.value || 'Wikimedia Commons contributor';
                    const license = extMeta.LicenseShortName?.value || extMeta.License?.value || 'Unknown license';
                    return {
                        url: url,
                        thumbnailUrl: url,
                        source: 'Wikimedia Commons',
                        sourceUrl: info.descriptionurl,
                        attribution: `${artist} (${license})`,
                        altText: description.replace(/<[^>]*>?/gm, ''),
                        originalQuery: query
                    };
                }
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Error searching Wikimedia for "${cleanQuery}":`, error.message);
            return null;
        }
    }
};
exports.VisualResourcesService = VisualResourcesService;
exports.VisualResourcesService = VisualResourcesService = VisualResourcesService_1 = __decorate([
    (0, common_1.Injectable)()
], VisualResourcesService);
//# sourceMappingURL=visual-resources.service.js.map