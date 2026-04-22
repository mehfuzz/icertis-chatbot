export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 w-fit">
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-typing" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-typing" style={{ animationDelay: '200ms' }} />
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-typing" style={{ animationDelay: '400ms' }} />
    </div>
  );
}
