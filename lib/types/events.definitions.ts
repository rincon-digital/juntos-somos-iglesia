export interface ImageInput {
  url: string;
  publicId: string;
  tags?: string[];
  isProtected?: boolean;
  isFavorite?: boolean;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  date?: string | Date;
  courseId?: string | null;
  images?: ImageInput[];
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string | Date;
  courseId?: string | null;
  images?: ImageInput[];
  isActive?: boolean;
}

export interface EventFilterOptions {
  courseId?: string;
  includeInactive?: boolean;
  limit?: number;
  skip?: number;
}

export interface UploadImageInput {
  url: string;
  publicId: string;
  tags?: string[];
  eventId?: string | null;
  isProtected?: boolean;
}

export interface UpdateImageInput {
  tags?: string[];
  isProtected?: boolean;
  isFavorite?: boolean;
  eventId?: string | null;
}

export interface ImageFilterOptions {
  eventId?: string | null;
  courseId?: string;
  isFavorite?: boolean;
  tag?: string;
  limit?: number;
  skip?: number;
}
