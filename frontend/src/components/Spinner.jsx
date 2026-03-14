export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center">
      <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
      {text}
    </div>
  )
}
