import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommercial } from '@/contexts/CommercialContext';

const Commercial = () => {
  const navigate = useNavigate();
  const { setShowCommercial } = useCommercial();

  useEffect(() => {
    setShowCommercial(true);
    navigate('/');
  }, [setShowCommercial, navigate]);

  return null;
};

export default Commercial;
