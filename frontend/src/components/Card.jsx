export default function Card({ children, className = '' }) {
  return (
    <div className={`glass-card rounded-2xl ${className}`}>
      {children}
    </div>
  )
}
