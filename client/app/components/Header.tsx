export default function Header({ onTrigger }: { onTrigger: () => void }) {
  return (
    <div className={`p-5 w-full h-full border-2 border-red-500 f-c-col`}>
      <h1 className="text-4xl font-semibold text-textPrimary">Quixo</h1>
      <p className="text-textTertiary ">
        Don't be scared. The things out there that are unknown aren't scary in
        themselves. They are just unknown at the moment. Take the time to know
        them before you list them as scary. Then the world will be a much less
        scary place for you.{" "}
      </p>
      <input className="hidden" type="file" />
      <button
        onClick={onTrigger}
        className="p-3 bg-textSecondary cursor-pointer rounded-xl text-xl font-semibold"
      >
        Connect
      </button>
    </div>
  );
}
