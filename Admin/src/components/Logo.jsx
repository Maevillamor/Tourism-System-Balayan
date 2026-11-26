
export default function Logo({ size = 40 }) {
  return (
    <img
      src="/balayanlogo.png"
      alt="Visit Balayan Logo"
      width={size}
      height={size}
      className="logo-img"
      style={{
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
}
