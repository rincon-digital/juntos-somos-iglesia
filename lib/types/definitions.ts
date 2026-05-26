export interface User {
  username: string;
  fullName: string;
  dni: string;
  phone: string;
  address: string;
}
export enum Role {
  superadmin = "superadmin",
  admin = "admin",
  user = "user",
}
export enum Rank {
  concurre = "concurre",
  miembro = "miembro",
}
export enum RoleInCourse {
  owner = "owner",
  editor = "editor",
}
export interface userLogin {
  dni: string;
  password: string;
}

export interface userRegister extends User {
  password: string;
  code: string;
  courseId: string;
}
//Interfaz de curso
export interface Course {
  name: string;
  description: string;
  openEnrollment: Date;
  quotaLimit: number;
  deadline: Date;
}
export interface CreateCourse extends Course {
  accessCode: string;
}

export interface RegisterCourse {
  courseId: string;
  accessCode: string;
}

export interface UpdateCourse extends Course {
  id: string;
}

export interface CourseRegistration {
  courseId: string;
  userId: string;
}
