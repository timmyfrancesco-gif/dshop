"use client";

const SUIT_CHAR: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣", "?": "" };

export default function PlayingCard({
  rank,
  suit,
  index = 0,
  hidden = false,
}: {
  rank: string;
  suit: string;
  index?: number;
  hidden?: boolean;
}) {
  const red = suit === "H" || suit === "D";
  if (hidden || rank === "?") {
    return (
      <div
        className="card card-back"
        style={{ animationDelay: `${index * 90}ms` }}
      >
        <div className="card-back-inner" />
      </div>
    );
  }
  return (
    <div
      className={`card ${red ? "card-red" : "card-black"}`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <span className="card-corner top">{rank}{SUIT_CHAR[suit]}</span>
      <span className="card-pip">{SUIT_CHAR[suit]}</span>
      <span className="card-corner bottom">{rank}{SUIT_CHAR[suit]}</span>
      <style jsx>{`
        .card-corner {
          position: absolute;
          font-size: 13px;
          font-weight: 800;
          line-height: 1;
        }
        .top { top: 6px; left: 7px; }
        .bottom { bottom: 6px; right: 7px; transform: rotate(180deg); }
        .card-pip { font-size: 30px; }
      `}</style>
    </div>
  );
}
