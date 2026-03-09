const CELLS = [
  { delay: '0ms', color: '#00FF87' },
  { delay: '100ms', color: '#0CFD95' },
  { delay: '200ms', color: '#17FBA2' },
  { delay: '100ms', color: '#23F9B2' },
  { delay: '200ms', color: '#30F7C3' },
  { delay: '300ms', color: '#3DF5D4' },
  { delay: '200ms', color: '#45F4DE' },
  { delay: '300ms', color: '#53F1F0' },
  { delay: '400ms', color: '#60EFFF' },
];

const LoaderGrid = () => (
  <>
    <style>{`
      @keyframes loader-ripple {
        0% { background-color: transparent }
        30% { background-color: var(--c) }
        60%, 100% { background-color: transparent }
      }
    `}</style>
    <div className="grid grid-cols-3 gap-px w-[158px] h-[158px]">
      {CELLS.map((cell, i) => (
        <div
          key={i}
          className="rounded-[4px]"
          style={{
            '--c': cell.color,
            animationDelay: cell.delay,
            animation: '1.5s loader-ripple ease infinite',
          } as React.CSSProperties}
        />
      ))}
    </div>
  </>
);

export default LoaderGrid;
