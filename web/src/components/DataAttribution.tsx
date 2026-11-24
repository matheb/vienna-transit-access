import { DATA_SOURCE_URL } from "@/constants/attribution";
import { useMessages } from "@/i18n/MessagesProvider";

export default function DataAttribution() {
  const messages = useMessages();
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
