import React, { useEffect, useState } from "react";

const getLogo = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) {
    return "/logos/01_morning.jpg";
  }

  if (hour >= 11 && hour < 15) {
    return "/logos/02_late_morning.jpg";
  }

  if (hour >= 15 && hour < 18) {
    return "/logos/03_afternoon.jpg";
  }

  if (hour >= 18 && hour < 21) {
    return "/logos/04_evening.jpg";
  }

  if (hour >= 21) {
    return "/logos/05_night.jpg";
  }

  if (hour < 3) {
    return "/logos/06_late_night_study.jpg";
  }

  return "/logos/07_early_morning.jpg";
};

export const SunnyLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [logo, setLogo] = useState(getLogo());

  useEffect(() => {
    const updateLogo = () => {
      setLogo(getLogo());
    };

    updateLogo();

    const timer = setInterval(updateLogo, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <img
      src={logo}
      alt="SunnyLearn"
      className={className}
    />
  );
};

export default SunnyLogo;
