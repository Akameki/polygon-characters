import './Clock.module.css'
import React, { useEffect, useState } from "react";

function Clock({endTime, trigger}) {
const calculateTimeLeft = () => {
  let year = new Date().getFullYear();
  //let difference = endTime - Math.floor(Date.now() / 1000)
  let difference = endTime - Math.floor(Date.now() / 1000)
  //const difference = +new Date(`${year}-10-19`) - +new Date();
  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (60 * 60 * 24)),
      hours: Math.floor((difference / (60 * 60)) % 24),
      minutes: Math.floor((difference  / 60) % 60),
      seconds: Math.floor((difference ) % 60),
    };
  }

  return timeLeft;
};

const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
const [year] = useState(new Date().getFullYear());

useEffect(() => {
  let timer = setTimeout(() => {
    let timeLeft = calculateTimeLeft();
    if (timeLeft.days == 0 && timeLeft.hours == 0 && timeLeft.minutes == 0 && timeLeft.seconds == 1) {trigger()};
    setTimeLeft(timeLeft);
  }, 1000);

  return () => {
    clearTimeout(timer);
  }
});

const timerComponents = [];

Object.keys(timeLeft).forEach((interval, i) => {
  if (!timeLeft[interval]) {
    return;
  }

  timerComponents.push(
    <span key={i}>
      {timeLeft[interval]} {interval}{" "}
    </span>
  );
});
return (
  <div>
    {timerComponents.length ? timerComponents : <span>Time is up!</span>}
  </div>
);
}

export default Clock;
