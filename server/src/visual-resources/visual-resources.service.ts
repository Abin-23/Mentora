import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface VisualMetadata {
  url: string;
  thumbnailUrl?: string;
  source: string;
  sourceUrl: string;
  attribution?: string;
  altText: string;
  originalQuery: string;
}

export interface VisualResourceProvider {
  search(query: string): Promise<VisualMetadata | null>;
}

@Injectable()
export class VisualResourcesService implements VisualResourceProvider {
  private readonly logger = new Logger(VisualResourcesService.name);

  async search(query: string): Promise<VisualMetadata | null> {
    // For safety, remove overly specific or strange characters from query
    const cleanQuery = query.replace(/[^\w\s-]/gi, '').trim();
    if (!cleanQuery) return null;

    try {
      this.logger.log(`Searching Wikimedia Commons for: "${cleanQuery}"`);
      
      const response = await axios.get('https://commons.wikimedia.org/w/api.php', {
        params: {
          action: 'query',
          format: 'json',
          generator: 'search',
          gsrnamespace: 6, // File namespace
          gsrsearch: cleanQuery + ' filetype:bitmap|drawing', // focus on images
          gsrlimit: 3,
          prop: 'imageinfo',
          iiprop: 'url|extmetadata',
          origin: '*'
        },
        headers: {
          'User-Agent': 'MentoraBot/1.0 (https://github.com/Mentora; mentora@example.com)'
        },
        timeout: 5000 // 5 seconds max
      });

      const pages = response.data?.query?.pages;
      if (!pages) {
        this.logger.debug(`No images found for query: ${cleanQuery}`);
        return null;
      }

      // Find the first valid image
      for (const pageId in pages) {
        const page = pages[pageId];
        if (page.imageinfo && page.imageinfo.length > 0) {
          const info = page.imageinfo[0];
          const extMeta = info.extmetadata || {};
          
          const title = page.title || '';
          // Ensure it's not a video or audio file (though our filetype constraint helps)
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
            thumbnailUrl: url, // Wikimedia URLs can be used directly or we could request thumbnail, but url is fine for now
            source: 'Wikimedia Commons',
            sourceUrl: info.descriptionurl,
            attribution: `${artist} (${license})`,
            altText: description.replace(/<[^>]*>?/gm, ''), // strip HTML tags
            originalQuery: query
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Error searching Wikimedia for "${cleanQuery}":`, error.message);
      return null;
    }
  }
}
