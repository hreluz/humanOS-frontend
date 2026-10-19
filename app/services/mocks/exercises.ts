import type { EquipmentKey, ExerciseDef, MuscleKey } from '~/types/training'

type Row = [name: string, cue: string]

// Exercise library keyed by main muscle, then equipment (the shape is flattened below, like GET /exercises).
const LIBRARY: Record<MuscleKey, Record<EquipmentKey, Row[]>> = {
  chest: {
    gym: [
      ['Barbell Bench Press', 'Shoulder blades pinned back, bar to mid-chest.'],
      ['Cable Fly', 'Soft elbows, hug the handles together at chest height.'],
      ['Machine Chest Press', 'Seat so the handles line up with mid-chest.'],
    ],
    dumbbell: [
      ['Dumbbell Bench Press', 'Lower until the dumbbells reach chest level, press up and in.'],
      ['Incline Dumbbell Press', 'Bench at 30°, keep wrists stacked over elbows.'],
      ['Dumbbell Fly', 'Wide arc, stop when you feel a stretch across the chest.'],
    ],
    bodyweight: [
      ['Push-up', 'Body in one line, chest to a fist from the floor.'],
      ['Decline Push-up', 'Feet on a bench to bias the upper chest.'],
      ['Chest Dip', 'Lean forward and let elbows flare slightly.'],
    ],
  },
  shoulders: {
    gym: [
      ['Barbell Overhead Press', 'Squeeze glutes, press the bar in a straight line overhead.'],
      ['Cable Lateral Raise', 'Lead with the elbow, stop at shoulder height.'],
      ['Machine Shoulder Press', 'Handles start at chin level, don\'t lock out hard.'],
    ],
    dumbbell: [
      ['Seated Dumbbell Press', 'Back against the pad, press without arching.'],
      ['Dumbbell Lateral Raise', 'Slight bend in the elbow, raise out to the sides.'],
      ['Arnold Press', 'Rotate palms out as you press up.'],
    ],
    bodyweight: [
      ['Pike Push-up', 'Hips high, lower the top of your head toward the floor.'],
      ['Wall Handstand Hold', 'Stack wrists, shoulders and hips against the wall.'],
      ['Plank Shoulder Tap', 'Keep hips square while tapping each shoulder.'],
    ],
  },
  biceps: {
    gym: [
      ['Barbell Curl', 'Elbows pinned to your sides, no swinging.'],
      ['Cable Curl', 'Constant tension: control the way down.'],
      ['Preacher Curl Machine', 'Full stretch at the bottom, squeeze at the top.'],
    ],
    dumbbell: [
      ['Dumbbell Curl', 'Supinate the wrist as you curl up.'],
      ['Hammer Curl', 'Neutral grip, curl straight up.'],
      ['Incline Dumbbell Curl', 'Arms hang behind the body for a deeper stretch.'],
    ],
    bodyweight: [
      ['Chin-up', 'Palms facing you, pull chest to the bar.'],
      ['Inverted Row (Underhand)', 'Underhand grip on a low bar, pull ribs to the bar.'],
    ],
  },
  triceps: {
    gym: [
      ['Cable Pushdown', 'Elbows fixed at your sides, spread the rope at the bottom.'],
      ['Close-grip Bench Press', 'Hands shoulder-width, elbows tucked.'],
      ['Overhead Cable Extension', 'Face away from the stack, stretch behind the head.'],
    ],
    dumbbell: [
      ['Overhead Dumbbell Extension', 'Both hands on one dumbbell, elbows pointing up.'],
      ['Dumbbell Kickback', 'Upper arm parallel to the floor, extend fully.'],
      ['Dumbbell Skull Crusher', 'Lower to the temples, elbows stay still.'],
    ],
    bodyweight: [
      ['Bench Dip', 'Hands on a bench behind you, elbows straight back.'],
      ['Diamond Push-up', 'Hands together under the chest.'],
    ],
  },
  forearms: {
    gym: [
      ['Barbell Wrist Curl', 'Forearms on the bench, curl only with the wrists.'],
      ['Cable Reverse Curl', 'Overhand grip, keep wrists straight.'],
    ],
    dumbbell: [
      ['Farmer\'s Carry', 'Heavy dumbbells, walk tall with a tight grip.'],
      ['Dumbbell Wrist Curl', 'Let the dumbbell roll to the fingers, then curl.'],
      ['Reverse Dumbbell Curl', 'Palms down the whole way.'],
    ],
    bodyweight: [
      ['Dead Hang', 'Hang from a bar as long as you can.'],
      ['Fingertip Push-up Hold', 'Hold the top of a push-up on your fingertips.'],
    ],
  },
  abs: {
    gym: [
      ['Cable Crunch', 'Kneel, curl the ribs toward the hips.'],
      ['Hanging Leg Raise', 'Raise legs without swinging, tilt the pelvis up.'],
      ['Ab Crunch Machine', 'Exhale fully as you crunch.'],
    ],
    dumbbell: [
      ['Weighted Crunch', 'Hold a dumbbell on the chest, short controlled range.'],
      ['Dumbbell V-up', 'Pass the dumbbell from hands to feet.'],
    ],
    bodyweight: [
      ['Plank', 'Squeeze glutes, ribs down, hold.'],
      ['Crunch', 'Lift the shoulder blades, don\'t pull on the neck.'],
      ['Dead Bug', 'Lower back pressed into the floor the whole time.'],
    ],
  },
  obliques: {
    gym: [
      ['Cable Woodchop', 'Rotate through the torso, arms stay long.'],
      ['Pallof Press', 'Press the handle out and resist the rotation.'],
    ],
    dumbbell: [
      ['Dumbbell Side Bend', 'One dumbbell, bend only sideways.'],
      ['Russian Twist', 'Lean back, turn the dumbbell side to side.'],
    ],
    bodyweight: [
      ['Side Plank', 'Hips high, body in a straight line.'],
      ['Bicycle Crunch', 'Elbow toward the opposite knee, slow tempo.'],
    ],
  },
  traps: {
    gym: [
      ['Barbell Shrug', 'Shrug straight up, pause at the top.'],
      ['Face Pull', 'Pull the rope to your forehead, elbows high.'],
    ],
    dumbbell: [
      ['Dumbbell Shrug', 'Arms long, lift the shoulders toward the ears.'],
      ['Dumbbell Upright Row', 'Elbows lead, stop at chest height.'],
    ],
    bodyweight: [
      ['Scapular Pull-up', 'Hang, then pull the shoulder blades down without bending the arms.'],
      ['Prone Y Raise', 'Lying face down, lift arms in a Y.'],
    ],
  },
  lats: {
    gym: [
      ['Lat Pulldown', 'Pull the bar to the upper chest, elbows down and back.'],
      ['Seated Cable Row', 'Chest up, row to the belly button.'],
      ['Barbell Row', 'Hinge to 45°, pull the bar to the lower ribs.'],
    ],
    dumbbell: [
      ['One-arm Dumbbell Row', 'Pull the elbow toward the hip.'],
      ['Dumbbell Pullover', 'Lower behind the head with a slight elbow bend.'],
      ['Chest-supported Dumbbell Row', 'Chest on an incline bench, no momentum.'],
    ],
    bodyweight: [
      ['Pull-up', 'Overhand grip, chin over the bar.'],
      ['Inverted Row', 'Body straight under a low bar, pull chest up.'],
    ],
  },
  lowerBack: {
    gym: [
      ['Back Extension', 'Hinge at the hips, stop at a straight line.'],
      ['Barbell Deadlift', 'Bar close to the shins, push the floor away.'],
    ],
    dumbbell: [
      ['Dumbbell Romanian Deadlift', 'Soft knees, push hips back.'],
      ['Dumbbell Good Morning', 'Dumbbell on the chest, hinge with a flat back.'],
    ],
    bodyweight: [
      ['Superman', 'Lift arms and legs together, hold for a second.'],
      ['Bird Dog', 'Opposite arm and leg, keep hips level.'],
    ],
  },
  glutes: {
    gym: [
      ['Barbell Hip Thrust', 'Chin tucked, drive through the heels to full lockout.'],
      ['Cable Kickback', 'Kick back and slightly out, don\'t arch.'],
      ['Hip Abduction Machine', 'Lean forward a little, push out slowly.'],
    ],
    dumbbell: [
      ['Dumbbell Hip Thrust', 'Dumbbell on the hips, squeeze at the top.'],
      ['Bulgarian Split Squat', 'Lean the torso forward to load the glutes.'],
      ['Dumbbell Step-up', 'Drive through the front heel.'],
    ],
    bodyweight: [
      ['Glute Bridge', 'Feet close to the hips, squeeze hard at the top.'],
      ['Single-leg Glute Bridge', 'One foot down, keep hips level.'],
      ['Donkey Kick', 'On all fours, kick the heel to the ceiling.'],
    ],
  },
  quads: {
    gym: [
      ['Barbell Back Squat', 'Brace, sit down between the heels, knees track the toes.'],
      ['Leg Press', 'Lower until knees reach 90°, don\'t lift the hips.'],
      ['Leg Extension', 'Pause at the top, slow on the way down.'],
    ],
    dumbbell: [
      ['Goblet Squat', 'Dumbbell at the chest, elbows inside the knees.'],
      ['Dumbbell Lunge', 'Long step, back knee kisses the floor.'],
      ['Dumbbell Front Squat', 'Dumbbells on the shoulders, stay upright.'],
    ],
    bodyweight: [
      ['Air Squat', 'Hips below the knees, chest up.'],
      ['Walking Lunge', 'Step through with control, torso tall.'],
      ['Wall Sit', 'Thighs parallel to the floor, hold.'],
    ],
  },
  hamstrings: {
    gym: [
      ['Lying Leg Curl', 'Hips pressed down, curl heels to glutes.'],
      ['Seated Leg Curl', 'Pad above the ankles, control the return.'],
      ['Barbell Romanian Deadlift', 'Bar slides down the thighs, hips back.'],
    ],
    dumbbell: [
      ['Dumbbell Stiff-leg Deadlift', 'Legs nearly straight, feel the hamstring stretch.'],
      ['Single-leg Dumbbell RDL', 'Hips square, reach the dumbbell to the floor.'],
    ],
    bodyweight: [
      ['Nordic Curl', 'Anchor the heels, lower as slowly as you can.'],
      ['Single-leg Bridge Walkout', 'From a bridge, walk the heels out and back.'],
    ],
  },
  calves: {
    gym: [
      ['Standing Calf Raise Machine', 'Full stretch at the bottom, pause at the top.'],
      ['Seated Calf Raise', 'Slow reps, knees bent at 90°.'],
    ],
    dumbbell: [
      ['Dumbbell Calf Raise', 'Dumbbells in hand, rise onto the balls of the feet.'],
      ['Single-leg Dumbbell Calf Raise', 'Stand on a step, one leg at a time.'],
    ],
    bodyweight: [
      ['Calf Raise', 'On a step, drop the heels below the edge.'],
      ['Jump Rope', 'Stay on the balls of the feet.'],
    ],
  },
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const EXERCISES: ExerciseDef[] = Object.entries(LIBRARY).flatMap(([muscle, byEquipment]) =>
  Object.entries(byEquipment).flatMap(([equipment, rows]) =>
    rows.map(([name, cue]) => ({ id: slug(name), name, muscle: muscle as MuscleKey, equipment: equipment as EquipmentKey, cue }))))
