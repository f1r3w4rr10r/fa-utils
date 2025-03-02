interface FaDescription {
  avatar_mtime: string;
  description: string;
  lower: string;
  title: string;
  username: string;
}

declare const descriptions: Record<string, FaDescription>;
