import { Link, LinkProps } from 'react-router-dom';
import { useProjectDetail } from '@/contexts/ProjectDetailContext';

interface NavLinkProps extends LinkProps {
  children: React.ReactNode;
}

export const NavLink = ({ children, onClick, ...props }: NavLinkProps) => {
  const { isProjectOpen, closeHandler } = useProjectDetail();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Close project detail if open
    if (isProjectOpen && closeHandler) {
      closeHandler();
    }

    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
};
