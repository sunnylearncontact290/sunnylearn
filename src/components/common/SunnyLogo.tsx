import React, { useEffect, useState } from "react";

export const TIME_BASED_LOGOS = {
  morning: "/assets/logo/01_morning.png",
  lateMorning: "/assets/logo/02_late_morning.png",
  afternoon: "/assets/logo/03_afternoon.png",
  evening: "/assets/logo/04_evening.png",
  night: "/assets/logo/05_night.png",
  lateNight: "/assets/logo/06_late_night.png",
  earlyMorning: "/assets/logo/07_early_morning.png",
} as const;

export const getLogoForHour = (hour: number = new Date().getHours()): string => {
  if (hour >= 5 && hour < 11) {
    return TIME_BASED_LOGOS.morning;
  }

  if (hour >= 11 && hour < 15) {
    return TIME_BASED_LOGOS.lateMorning;
  }

  if (hour >= 15 && hour < 18) {
    return TIME_BASED_LOGOS.afternoon;
  }

  if (hour >= 18 && hour < 21) {
    return TIME_BASED_LOGOS.evening;
  }

  if (hour >= 21) {
    return TIME_BASED_LOGOS.night;
  }

  if (hour < 3) {
    return TIME_BASED_LOGOS.lateNight;
  }

  return TIME_BASED_LOGOS.earlyMorning;
};

export const SunnyLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [logo, setLogo] = useState(() => getLogoForHour());

  useEffect(() => {
    const updateLogo = () => {
      setLogo(getLogoForHour());
    };

    updateLogo();

    const timer = setInterval(updateLogo, 60000);

    return () => clearInterval(timer);
  }, []);

  const extraClasses = className
    .replace(/\bobject-(cover|contain)\b/g, "")
    .replace(/\brounded-\S+\b/g, "")
    .trim();

  const normalizedClassName = [
    "block w-full h-full object-cover rounded-[22%]",
    extraClasses,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      src={logo}
      alt="SunnyLearn"
      className={normalizedClassName}
    />
  );
};

export default SunnyLogo;
