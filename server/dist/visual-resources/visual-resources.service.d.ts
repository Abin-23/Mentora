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
export declare class VisualResourcesService implements VisualResourceProvider {
    private readonly logger;
    search(query: string): Promise<VisualMetadata | null>;
}
