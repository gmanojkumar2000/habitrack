import type { HabitTemplate } from '../types';

const DinoSounds = [
  "VROOOOM!",
  "ROAAAAR!",
  "CLANK-CLANK!",
  "CHOMP-CHOMP!",
  "BEEP BEEP!",
  "SQUEEEAL!",
  "KA-CHOW!",
  "HONK-HONK!",
  "RUMBLE-RUMBLE!"
];

const GeneralCheers = [
  "High-octane effort! Keep driving!",
  "That was tire-rific!",
  "You're firing on all cylinders today!",
  "Dino-power fully charged!",
  "Supercharge activated! Zoom!",
  "Your productivity engines are purring!",
  "Whoa! That's some serious gear-turning skill!",
  "You're cruisin' to the top!",
  "CRUNCH! That habit got absolutely demolished!"
];

const CompleteCheers = [
  "ENGINES REDLINING! You finished every single goal!",
  "GRAND PRIX WINNER! Your checklist is 100% clear!",
  "MEGA-ROAR! Perfect score today! You are unstoppable!",
  "FULL TANK! All habits powered up and complete!",
  "Trophy unlocked! You crushed today like a car-smasher!"
];

const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export interface MascotMessage {
  title: string;
  message: string;
  type: 'success' | 'streak' | 'warning' | 'party';
}

/**
 * Generates a randomized, context-aware nudge from Tyro.
 */
export const getSmartMascotMessage = (
  remainingHabits: HabitTemplate[],
  completedTodayCount: number,
  streak: number
): MascotMessage => {
  const sound = pickRandom(DinoSounds);
  
  // Case 1: Everything is complete!
  if (remainingHabits.length === 0) {
    const finishCheer = pickRandom(CompleteCheers);
    return {
      title: `${sound} ALL DONE!`,
      message: `${finishCheer} You're riding an amazing ${streak}-day streak!`,
      type: 'party'
    };
  }

  // Check if there's a critical habit left in the remaining ones
  const criticalHabits = remainingHabits.filter(h => h.isCritical);
  
  // Case 2: A critical habit is missing!
  if (criticalHabits.length > 0) {
    const target = pickRandom(criticalHabits);
    const warnings = [
      `Don't let your streak tire out! Shift into gear and complete '${target.title}'!`,
      `Alert! '${target.title}' is a CRITICAL engine part! Complete it next to avoid breaking the streak!`,
      `Quick! Roll over to '${target.title}' so we don't lose power on our ${streak}-day streak!`,
      `Your dashboard warning light is blinking! Polish off '${target.title}' next!`
    ];
    
    return {
      title: `${sound} CRITICAL ALERT!`,
      message: pickRandom(warnings),
      type: 'warning'
    };
  }

  // Case 3: Highly rewarding tasks remaining (> 10 points)
  const highPointsHabits = remainingHabits.filter(h => h.points >= 10);
  if (highPointsHabits.length > 0) {
    const target = pickRandom(highPointsHabits);
    const fuelUps = [
      `Want a high-octane boost? Crush '${target.title}' to claim ${target.points} massive points!`,
      `Look at those shiny points! Knock out '${target.title}' for a big ${target.points}-point payload!`,
      `Fuel station ahead! '${target.title}' is worth ${target.points} points! Go grab it!`,
      `Turbo-charge your wallet! Finish '${target.title}' for a cool ${target.points} points!`
    ];

    return {
      title: `${sound} BIG POINTS!`,
      message: pickRandom(fuelUps),
      type: 'success'
    };
  }

  // Case 4: Only 1 task left to finish the whole list!
  if (remainingHabits.length === 1) {
    const target = remainingHabits[0];
    const finishStrong = [
      `Just one final gear to turn! Crank out '${target.title}' to finish the day!`,
      `The finish line is right there! Dash through '${target.title}' for a perfect day!`,
      `Only one task left! Ready... set... finish '${target.title}'!`,
      `Vroom! Final lap! Finish '${target.title}' to get your perfect daily score!`
    ];

    return {
      title: `${sound} ALMOST THERE!`,
      message: pickRandom(finishStrong),
      type: 'streak'
    };
  }

  // Case 5: General progress encouragement with a random task recommendation
  const target = pickRandom(remainingHabits);
  const generalEncouragement = pickRandom(GeneralCheers);
  const recommendations = [
    `Next stop: Let's tackle '${target.title}' for a quick ${target.points} points!`,
    `How about we roll over to '${target.title}' next?`,
    `Keep those tires spinning! Can you crush '${target.title}' next?`,
    `Let's put the pedal to the metal on '${target.title}'!`
  ];

  return {
    title: `${sound} ${completedTodayCount} DONE!`,
    message: `${generalEncouragement} ${pickRandom(recommendations)}`,
    type: 'success'
  };
};
