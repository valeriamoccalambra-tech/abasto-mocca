export const metadata = {
  title: 'Abasto Mocca',
  description: 'Sistema de abastecimiento e inventario de Pastelería Mocca',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#FBF7F2',
          color: '#2B2320',
        }}
      >
        {children}
      </body>
    </html>
  );
}
