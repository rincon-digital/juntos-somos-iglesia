-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('superadmin', 'admin', 'user') NOT NULL DEFAULT 'user';
