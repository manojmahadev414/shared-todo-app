-- Google OAuth users choose a username after their first sign-in.
ALTER TABLE `user` MODIFY `username` VARCHAR(32) NULL;
