interface Props {
  year?: number;
}

export default function PageFooter({ year }: Props) {
  const currentYear = year || new Date().getFullYear();
  return (
    <footer className="py-6 text-center">
      <p className="text-xs text-slate-400">
        &copy; {currentYear} Cell Ministry Tracker. All rights reserved.
      </p>
    </footer>
  );
}
