export interface courseVideo {
  title: string;
  order: number;
  courseId: string;
}

export interface createVideo extends courseVideo {
  videoUrl: string;
}

export interface updateVideo {
  id: string;
  title: string;
  order: number;
}
