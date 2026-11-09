export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: any;
  query?: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string | undefined>;
  url?: string;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

export interface ApiResponse {
  status(statusCode: number): this;
  json(body: any): this;
  send(body: any): this;
  setHeader(name: string, value: string | number | readonly string[]): this;
  end(): void;
}
