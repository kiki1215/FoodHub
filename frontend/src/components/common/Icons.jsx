export function BowlLogoIcon({ className = 'h-8 w-8' }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 17H30C29.2 24.5 24.2 29 18 29C11.8 29 6.8 24.5 6 17Z" fill="#F47721" />
      <rect x="13" y="30" width="10" height="2.5" rx="1.25" fill="#F47721" />
      <path d="M10 14C12.5 11 16 11.5 18.5 14C21 11.5 24.5 11 27 14" stroke="#F47721" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 7L28 4" stroke="#E06510" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 10L29 8" stroke="#E06510" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16.5 16.5" strokeLinecap="round" />
    </svg>
  );
}

export function CartIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4H5L7.4 15.2C7.6 16.2 8.5 17 9.6 17H18.4C19.4 17 20.3 16.3 20.5 15.3L22 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20C4.8 16.4 8 14 12 14C16 14 19.2 16.4 20 20" strokeLinecap="round" />
    </svg>
  );
}

export function LocationIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
    </svg>
  );
}

export function EyeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12C4.2 7.5 7.8 5 12 5C16.2 5 19.8 7.5 22 12C19.8 16.5 16.2 19 12 19C7.8 19 4.2 16.5 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3L21 21" strokeLinecap="round" />
      <path d="M10.6 10.6C10.2 11 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 13 13.8 13.4 13.4" strokeLinecap="round" />
      <path d="M9.9 5.2C10.6 5.1 11.3 5 12 5C16.2 5 19.8 7.5 22 12C21.2 13.7 20.1 15.1 18.8 16.2M6.5 6.6C4.6 7.8 3.1 9.7 2 12C4.2 16.5 7.8 19 12 19C13.8 19 15.5 18.5 17 17.7" strokeLinecap="round" />
    </svg>
  );
}

export function LockIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 9H16V7C16 4.79 14.21 3 12 3C9.79 3 8 4.79 8 7V9H7C5.9 9 5 9.9 5 11V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V11C19 9.9 18.1 9 17 9ZM10 7C10 5.9 10.9 5 12 5C13.1 5 14 5.9 14 7V9H10V7Z" />
    </svg>
  );
}

export function FileTextIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" strokeLinejoin="round" />
      <path d="M14 2V8H20M8 13H16M8 17H13" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7V12L15 14" strokeLinecap="round" />
    </svg>
  );
}

export function LogOutIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9" strokeLinecap="round" />
      <path d="M16 17L21 12L16 7M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M3 6H21" strokeLinecap="round" />
      <path d="M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6" strokeLinecap="round" />
      <path d="M19 6L18.2 19.1C18.1 20.2 17.2 21 16.1 21H7.9C6.8 21 5.9 20.2 5.8 19.1L5 6" strokeLinecap="round" />
      <path d="M10 11V17M14 11V17" strokeLinecap="round" />
    </svg>
  );
}

export function CheckCircleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
    </svg>
  );
}
