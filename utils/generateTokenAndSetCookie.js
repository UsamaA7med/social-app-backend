import JsonWebToken from "jsonwebtoken";
export default async (email, username, isVerified, res) => {
  if (!isVerified) {
    throw new Error("User not verified");
  }
  const token = JsonWebToken.sign(
    { email, username, isVerified },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    secure: true,
    path: "/",
    domain: "https://social-app-frontend-tawny.vercel.app",
  });
};
