import { DATA_SOURCE_URL } from "@/constants/attribution";
import { messages } from "@/i18n/en";

export default function DataAttribution() {
  return (
    <footer className="text-xs text-muted-foreground">
      {messages.DataAttribution.prefix}{" "}
      <a href={DATA_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
        {messages.DataAttribution.link}
      </a>
      {messages.DataAttribution.suffix}
    </footer>
  );
}
