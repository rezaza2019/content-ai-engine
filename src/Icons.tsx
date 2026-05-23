export const WordpressIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M12.158 12.786l-2.698 7.84c.806.236 1.657.365 2.54.365 1.047 0 2.05-.18 2.986-.51l-2.828-7.695zM5.563 20.306L9.61 8.8c.28-.756.234-1.163-.163-1.163h-.984v-.98h5.36v.98h-.762c-.443 0-.583.256-.443.676l1.236 3.553.863 2.56 1.7-5.46c.117-.373 0-.653-.28-.653h-.72v-.98h4.298v.98h-.466c-.35 0-.583.186-.746.676l-2.868 8.44c2.26-1.54 3.73-4.135 3.73-7.11 0-4.66-3.794-8.455-8.454-8.455-4.66 0-8.455 3.795-8.455 8.456 0 3.33 1.93 6.2 4.743 7.625zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
  </svg>
);

export const TelegramIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.05-.19-.02-.27 0l-3.83 2.4c-.38.25-.76.38-1.11.37-.38-.01-1.1-.21-1.63-.38-.66-.21-1.18-.32-1.15-.68.02-.19.28-.39.81-.61 3.16-1.38 5.27-2.29 6.33-2.73 3-.1.66-3.83 1.13-3.87 1.48-.05 1.25.79 1.25.99z"/>
  </svg>
);

export { 
  Facebook as FacebookIcon, 
  Instagram as InstagramIcon, 
  ExternalLink as ExternalLinkIcon,
  History as RecentIcon,
  Hotel as AccommodationIcon,
  FileJson as JsonIcon,
  Link as EditLinkIcon
} from 'lucide-react';
