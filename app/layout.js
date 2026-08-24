export const metadata = {
  title: "Ai180 AI学习教练",
  description: "180天AI职业转型学习系统",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
