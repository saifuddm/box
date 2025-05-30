export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start font-[family-name:var(--font-geist-mono)]">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h1 className="text-4xl font-bold">Welcome to Box</h1>
          <h2 className="text-lg text-muted-foreground">
            Create short lived boxes to pass information between devices.
          </h2>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row w-full justify-center">
          <a
            className="bg-card text-card-foreground font-bold rounded-md px-4 py-2 hover:border-primary border-2 border-transparent transition-colors"
            href="/create"
          >
            Create Box
          </a>
          <a
            className="bg-muted text-muted-foreground font-bold rounded-md px-4 py-2 hover:border-primary border-2 border-transparent transition-colors"
            href="/search"
            target="_blank"
            rel="noopener noreferrer"
          >
            Search Box
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex flex-wrap items-center justify-center">
        <p className="text-muted-foreground">
          Made with ❤️ by{" "}
          <a
            className="inline-flex hover:underline hover:underline-offset-4 text-primary"
            href="https://github.com/saifuddm"
            target="_blank"
            rel="noopener noreferrer"
          >
            saifuddm
          </a>
        </p>
      </footer>
    </div>
  );
}
