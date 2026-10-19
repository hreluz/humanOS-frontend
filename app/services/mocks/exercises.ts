import type { EquipmentKey, MuscleKey } from '~/types/training'

/** An exercise as the API would return it: photos are referenced by free-exercise-db id. */
export interface MockExercise {
  id: string
  name: string
  muscle: MuscleKey
  equipment: EquipmentKey
  cue: string
  photoIds: string[]
}

/** Name, form cue, and free-exercise-db ids for photos: the exercise itself first, then close variants (similar machines). */
type Row = [name: string, cue: string, photoIds?: string[]]

// Exercise library keyed by main muscle, then equipment (the shape is flattened below, like GET /exercises).
const LIBRARY: Record<MuscleKey, Record<EquipmentKey, Row[]>> = {
  chest: {
    gym: [
      ['Barbell Bench Press', 'Shoulder blades pinned back, bar to mid-chest.', ['Barbell_Bench_Press_-_Medium_Grip', 'Wide-Grip_Barbell_Bench_Press', 'Smith_Machine_Bench_Press']],
      ['Cable Fly', 'Soft elbows, hug the handles together at chest height.', ['Flat_Bench_Cable_Flyes', 'Incline_Cable_Flye', 'Butterfly']],
      ['Machine Chest Press', 'Seat so the handles line up with mid-chest.', ['Leverage_Chest_Press', 'Machine_Bench_Press', 'Leverage_Incline_Chest_Press', 'Cable_Chest_Press']],
    ],
    dumbbell: [
      ['Dumbbell Bench Press', 'Lower until the dumbbells reach chest level, press up and in.', ['Dumbbell_Bench_Press']],
      ['Incline Dumbbell Press', 'Bench at 30°, keep wrists stacked over elbows.', ['Hammer_Grip_Incline_DB_Bench_Press']],
      ['Dumbbell Fly', 'Wide arc, stop when you feel a stretch across the chest.', ['Dumbbell_Flyes']],
    ],
    bodyweight: [
      ['Push-up', 'Body in one line, chest to a fist from the floor.', ['Pushups']],
      ['Decline Push-up', 'Feet on a bench to bias the upper chest.', ['Decline_Push-Up']],
      ['Chest Dip', 'Lean forward and let elbows flare slightly.', ['Dips_-_Chest_Version']],
    ],
  },
  shoulders: {
    gym: [
      ['Barbell Overhead Press', 'Squeeze glutes, press the bar in a straight line overhead.', ['Standing_Military_Press', 'Seated_Barbell_Military_Press', 'Smith_Machine_Overhead_Shoulder_Press']],
      ['Cable Lateral Raise', 'Lead with the elbow, stop at shoulder height.', ['Cable_Seated_Lateral_Raise', 'Bent_Over_Low-Pulley_Side_Lateral']],
      ['Machine Shoulder Press', 'Handles start at chin level, don\'t lock out hard.', ['Machine_Shoulder_Military_Press', 'Leverage_Shoulder_Press', 'Seated_Cable_Shoulder_Press']],
    ],
    dumbbell: [
      ['Seated Dumbbell Press', 'Back against the pad, press without arching.', ['Dumbbell_Shoulder_Press']],
      ['Dumbbell Lateral Raise', 'Slight bend in the elbow, raise out to the sides.', ['Side_Lateral_Raise']],
      ['Arnold Press', 'Rotate palms out as you press up.', ['Arnold_Dumbbell_Press']],
    ],
    bodyweight: [
      ['Pike Push-up', 'Hips high, lower the top of your head toward the floor.', ['Handstand_Push-Ups']],
      ['Wall Handstand Hold', 'Stack wrists, shoulders and hips against the wall.'],
      ['Plank Shoulder Tap', 'Keep hips square while tapping each shoulder.'],
    ],
  },
  biceps: {
    gym: [
      ['Barbell Curl', 'Elbows pinned to your sides, no swinging.', ['Barbell_Curl', 'EZ-Bar_Curl', 'Wide-Grip_Standing_Barbell_Curl']],
      ['Cable Curl', 'Constant tension: control the way down.', ['Standing_Biceps_Cable_Curl', 'High_Cable_Curls', 'Cable_Hammer_Curls_-_Rope_Attachment']],
      ['Preacher Curl Machine', 'Full stretch at the bottom, squeeze at the top.', ['Machine_Preacher_Curls', 'Machine_Bicep_Curl', 'Cable_Preacher_Curl']],
    ],
    dumbbell: [
      ['Dumbbell Curl', 'Supinate the wrist as you curl up.', ['Dumbbell_Bicep_Curl']],
      ['Hammer Curl', 'Neutral grip, curl straight up.', ['Hammer_Curls']],
      ['Incline Dumbbell Curl', 'Arms hang behind the body for a deeper stretch.', ['Incline_Dumbbell_Curl']],
    ],
    bodyweight: [
      ['Chin-up', 'Palms facing you, pull chest to the bar.', ['Chin-Up']],
      ['Inverted Row (Underhand)', 'Underhand grip on a low bar, pull ribs to the bar.', ['Inverted_Row']],
    ],
  },
  triceps: {
    gym: [
      ['Cable Pushdown', 'Elbows fixed at your sides, spread the rope at the bottom.', ['Triceps_Pushdown', 'Triceps_Pushdown_-_Rope_Attachment', 'Triceps_Pushdown_-_V-Bar_Attachment', 'Machine_Triceps_Extension']],
      ['Close-grip Bench Press', 'Hands shoulder-width, elbows tucked.', ['Close-Grip_Barbell_Bench_Press', 'Smith_Machine_Close-Grip_Bench_Press']],
      ['Overhead Cable Extension', 'Face away from the stack, stretch behind the head.', ['Cable_Rope_Overhead_Triceps_Extension', 'Triceps_Overhead_Extension_with_Rope']],
    ],
    dumbbell: [
      ['Overhead Dumbbell Extension', 'Both hands on one dumbbell, elbows pointing up.', ['Standing_Dumbbell_Triceps_Extension']],
      ['Dumbbell Kickback', 'Upper arm parallel to the floor, extend fully.', ['Tricep_Dumbbell_Kickback']],
      ['Dumbbell Skull Crusher', 'Lower to the temples, elbows stay still.'],
    ],
    bodyweight: [
      ['Bench Dip', 'Hands on a bench behind you, elbows straight back.', ['Bench_Dips']],
      ['Diamond Push-up', 'Hands together under the chest.', ['Push-Ups_-_Close_Triceps_Position']],
    ],
  },
  forearms: {
    gym: [
      ['Barbell Wrist Curl', 'Forearms on the bench, curl only with the wrists.', ['Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', 'Seated_Palm-Up_Barbell_Wrist_Curl']],
      ['Cable Reverse Curl', 'Overhand grip, keep wrists straight.', ['Reverse_Cable_Curl']],
    ],
    dumbbell: [
      ['Farmer\'s Carry', 'Heavy dumbbells, walk tall with a tight grip.', ['Farmers_Walk']],
      ['Dumbbell Wrist Curl', 'Let the dumbbell roll to the fingers, then curl.', ['Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench']],
      ['Reverse Dumbbell Curl', 'Palms down the whole way.', ['Standing_Dumbbell_Reverse_Curl']],
    ],
    bodyweight: [
      ['Dead Hang', 'Hang from a bar as long as you can.', ['One_Handed_Hang']],
      ['Fingertip Push-up Hold', 'Hold the top of a push-up on your fingertips.'],
    ],
  },
  abs: {
    gym: [
      ['Cable Crunch', 'Kneel, curl the ribs toward the hips.', ['Cable_Crunch', 'Cable_Seated_Crunch', 'Standing_Rope_Crunch']],
      ['Hanging Leg Raise', 'Raise legs without swinging, tilt the pelvis up.', ['Hanging_Leg_Raise']],
      ['Ab Crunch Machine', 'Exhale fully as you crunch.', ['Ab_Crunch_Machine']],
    ],
    dumbbell: [
      ['Weighted Crunch', 'Hold a dumbbell on the chest, short controlled range.', ['Weighted_Crunches']],
      ['Dumbbell V-up', 'Pass the dumbbell from hands to feet.'],
    ],
    bodyweight: [
      ['Plank', 'Squeeze glutes, ribs down, hold.', ['Plank']],
      ['Crunch', 'Lift the shoulder blades, don\'t pull on the neck.', ['Crunches']],
      ['Dead Bug', 'Lower back pressed into the floor the whole time.', ['Dead_Bug']],
    ],
  },
  obliques: {
    gym: [
      ['Cable Woodchop', 'Rotate through the torso, arms stay long.', ['Standing_Cable_Wood_Chop']],
      ['Pallof Press', 'Press the handle out and resist the rotation.', ['Pallof_Press', 'Pallof_Press_With_Rotation']],
    ],
    dumbbell: [
      ['Dumbbell Side Bend', 'One dumbbell, bend only sideways.', ['Dumbbell_Side_Bend']],
      ['Russian Twist', 'Lean back, turn the dumbbell side to side.', ['Russian_Twist']],
    ],
    bodyweight: [
      ['Side Plank', 'Hips high, body in a straight line.', ['Side_Bridge']],
      ['Bicycle Crunch', 'Elbow toward the opposite knee, slow tempo.', ['Air_Bike']],
    ],
  },
  traps: {
    gym: [
      ['Barbell Shrug', 'Shrug straight up, pause at the top.', ['Barbell_Shrug', 'Leverage_Shrug', 'Smith_Machine_Behind_the_Back_Shrug', 'Cable_Shrugs']],
      ['Face Pull', 'Pull the rope to your forehead, elbows high.', ['Face_Pull', 'Cable_Rope_Rear-Delt_Rows']],
    ],
    dumbbell: [
      ['Dumbbell Shrug', 'Arms long, lift the shoulders toward the ears.', ['Dumbbell_Shrug']],
      ['Dumbbell Upright Row', 'Elbows lead, stop at chest height.', ['Standing_Dumbbell_Upright_Row']],
    ],
    bodyweight: [
      ['Scapular Pull-up', 'Hang, then pull the shoulder blades down without bending the arms.', ['Scapular_Pull-Up']],
      ['Prone Y Raise', 'Lying face down, lift arms in a Y.'],
    ],
  },
  lats: {
    gym: [
      ['Lat Pulldown', 'Pull the bar to the upper chest, elbows down and back.', ['Wide-Grip_Lat_Pulldown', 'Close-Grip_Front_Lat_Pulldown', 'V-Bar_Pulldown', 'Underhand_Cable_Pulldowns', 'Full_Range-Of-Motion_Lat_Pulldown']],
      ['Seated Cable Row', 'Chest up, row to the belly button.', ['Seated_Cable_Rows', 'Leverage_Iso_Row', 'Seated_One-arm_Cable_Pulley_Rows', 'Leverage_High_Row']],
      ['Barbell Row', 'Hinge to 45°, pull the bar to the lower ribs.', ['Bent_Over_Barbell_Row', 'T-Bar_Row_with_Handle', 'Smith_Machine_Bent_Over_Row']],
    ],
    dumbbell: [
      ['One-arm Dumbbell Row', 'Pull the elbow toward the hip.', ['One-Arm_Dumbbell_Row']],
      ['Dumbbell Pullover', 'Lower behind the head with a slight elbow bend.', ['Bent-Arm_Dumbbell_Pullover']],
      ['Chest-supported Dumbbell Row', 'Chest on an incline bench, no momentum.', ['Dumbbell_Incline_Row']],
    ],
    bodyweight: [
      ['Pull-up', 'Overhand grip, chin over the bar.', ['Pullups']],
      ['Inverted Row', 'Body straight under a low bar, pull chest up.', ['Inverted_Row']],
    ],
  },
  lowerBack: {
    gym: [
      ['Back Extension', 'Hinge at the hips, stop at a straight line.', ['Hyperextensions_Back_Extensions', 'Reverse_Hyperextension']],
      ['Barbell Deadlift', 'Bar close to the shins, push the floor away.', ['Barbell_Deadlift', 'Trap_Bar_Deadlift', 'Sumo_Deadlift']],
    ],
    dumbbell: [
      ['Dumbbell Romanian Deadlift', 'Soft knees, push hips back.', ['Stiff-Legged_Dumbbell_Deadlift']],
      ['Dumbbell Good Morning', 'Dumbbell on the chest, hinge with a flat back.'],
    ],
    bodyweight: [
      ['Superman', 'Lift arms and legs together, hold for a second.', ['Superman']],
      ['Bird Dog', 'Opposite arm and leg, keep hips level.'],
    ],
  },
  glutes: {
    gym: [
      ['Barbell Hip Thrust', 'Chin tucked, drive through the heels to full lockout.', ['Barbell_Hip_Thrust', 'Barbell_Glute_Bridge', 'Smith_Machine_Hip_Raise']],
      ['Cable Kickback', 'Kick back and slightly out, don\'t arch.', ['One-Legged_Cable_Kickback', 'Glute_Kickback']],
      ['Hip Abduction Machine', 'Lean forward a little, push out slowly.', ['Thigh_Abductor']],
    ],
    dumbbell: [
      ['Dumbbell Hip Thrust', 'Dumbbell on the hips, squeeze at the top.'],
      ['Bulgarian Split Squat', 'Lean the torso forward to load the glutes.', ['Split_Squat_with_Dumbbells']],
      ['Dumbbell Step-up', 'Drive through the front heel.', ['Dumbbell_Step_Ups']],
    ],
    bodyweight: [
      ['Glute Bridge', 'Feet close to the hips, squeeze hard at the top.', ['Butt_Lift_Bridge']],
      ['Single-leg Glute Bridge', 'One foot down, keep hips level.', ['Single_Leg_Glute_Bridge']],
      ['Donkey Kick', 'On all fours, kick the heel to the ceiling.'],
    ],
  },
  quads: {
    gym: [
      ['Barbell Back Squat', 'Brace, sit down between the heels, knees track the toes.', ['Barbell_Squat', 'Smith_Machine_Squat', 'Hack_Squat', 'Barbell_Full_Squat']],
      ['Leg Press', 'Lower until knees reach 90°, don\'t lift the hips.', ['Leg_Press', 'Narrow_Stance_Leg_Press', 'Smith_Machine_Leg_Press']],
      ['Leg Extension', 'Pause at the top, slow on the way down.', ['Leg_Extensions', 'Single-Leg_Leg_Extension']],
    ],
    dumbbell: [
      ['Goblet Squat', 'Dumbbell at the chest, elbows inside the knees.', ['Goblet_Squat']],
      ['Dumbbell Lunge', 'Long step, back knee kisses the floor.', ['Dumbbell_Lunges']],
      ['Dumbbell Front Squat', 'Dumbbells on the shoulders, stay upright.', ['Dumbbell_Squat']],
    ],
    bodyweight: [
      ['Air Squat', 'Hips below the knees, chest up.', ['Bodyweight_Squat']],
      ['Walking Lunge', 'Step through with control, torso tall.', ['Bodyweight_Walking_Lunge']],
      ['Wall Sit', 'Thighs parallel to the floor, hold.'],
    ],
  },
  hamstrings: {
    gym: [
      ['Lying Leg Curl', 'Hips pressed down, curl heels to glutes.', ['Lying_Leg_Curls', 'Standing_Leg_Curl']],
      ['Seated Leg Curl', 'Pad above the ankles, control the return.', ['Seated_Leg_Curl']],
      ['Barbell Romanian Deadlift', 'Bar slides down the thighs, hips back.', ['Romanian_Deadlift', 'Stiff-Legged_Barbell_Deadlift', 'Smith_Machine_Stiff-Legged_Deadlift']],
    ],
    dumbbell: [
      ['Dumbbell Stiff-leg Deadlift', 'Legs nearly straight, feel the hamstring stretch.', ['Stiff-Legged_Dumbbell_Deadlift']],
      ['Single-leg Dumbbell RDL', 'Hips square, reach the dumbbell to the floor.'],
    ],
    bodyweight: [
      ['Nordic Curl', 'Anchor the heels, lower as slowly as you can.', ['Natural_Glute_Ham_Raise']],
      ['Single-leg Bridge Walkout', 'From a bridge, walk the heels out and back.'],
    ],
  },
  calves: {
    gym: [
      ['Standing Calf Raise Machine', 'Full stretch at the bottom, pause at the top.', ['Standing_Calf_Raises', 'Smith_Machine_Calf_Raise', 'Calf_Press_On_The_Leg_Press_Machine', 'Donkey_Calf_Raises']],
      ['Seated Calf Raise', 'Slow reps, knees bent at 90°.', ['Seated_Calf_Raise', 'Barbell_Seated_Calf_Raise']],
    ],
    dumbbell: [
      ['Dumbbell Calf Raise', 'Dumbbells in hand, rise onto the balls of the feet.', ['Standing_Dumbbell_Calf_Raise']],
      ['Single-leg Dumbbell Calf Raise', 'Stand on a step, one leg at a time.', ['Dumbbell_Seated_One-Leg_Calf_Raise']],
    ],
    bodyweight: [
      ['Calf Raise', 'On a step, drop the heels below the edge.', ['Calf_Raise_On_A_Dumbbell']],
      ['Jump Rope', 'Stay on the balls of the feet.', ['Rope_Jumping']],
    ],
  },
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const EXERCISES: MockExercise[] = Object.entries(LIBRARY).flatMap(([muscle, byEquipment]) =>
  Object.entries(byEquipment).flatMap(([equipment, rows]) =>
    rows.map(([name, cue, photoIds = []]) => ({ id: slug(name), name, muscle: muscle as MuscleKey, equipment: equipment as EquipmentKey, cue, photoIds }))))
