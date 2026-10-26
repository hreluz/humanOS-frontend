import type { MuscleKey } from '~/types/training'

/** The equipment groups the mocked exercises use. A union, so a typo in the list below fails typecheck. */
type MockEquipmentGroup = 'gym' | 'dumbbell' | 'bodyweight'

/** An exercise as the API would return it: photos are referenced by free-exercise-db id. */
export interface MockExercise {
  id: string
  name: string
  equipmentGroup: MockEquipmentGroup
  cue: string
  /** Muscles the exercise mainly trains. */
  primary: MuscleKey[]
  /** Muscles that assist. */
  secondary: MuscleKey[]
  /** The exercise's own free-exercise-db id first, then close variants (similar machines). */
  photoIds: string[]
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function ex(name: string, equipmentGroup: MockEquipmentGroup, cue: string, primary: MuscleKey[], secondary: MuscleKey[], photoIds: string[] = []): MockExercise {
  return { id: slug(name), name, equipmentGroup, cue, primary, secondary, photoIds }
}

// Shorthands for muscles that are almost always tagged together.
const HAMSTRINGS: MuscleKey[] = ['hamstrings_inner', 'hamstrings_outer']
const TRICEPS: MuscleKey[] = ['triceps_lateral', 'triceps_long']

/*
 * Each exercise is tagged with the muscles it mainly trains (primary) and the ones that assist (secondary).
 * Chest: incline work biases the upper (clavicular) head, flat work both heads, decline and dips the mid/lower (sternal) head.
 */
export const EXERCISES: MockExercise[] = [
  // Chest
  ex('Barbell Bench Press', 'gym', 'Shoulder blades pinned back, bar to mid-chest.', ['lower_chest', 'upper_chest'], ['front_delts', ...TRICEPS], ['Barbell_Bench_Press_-_Medium_Grip', 'Wide-Grip_Barbell_Bench_Press', 'Smith_Machine_Bench_Press']),
  ex('Incline Barbell Press', 'gym', 'Bench at 30°, lower the bar to the upper chest.', ['upper_chest'], ['front_delts', 'triceps_lateral'], ['Barbell_Incline_Bench_Press_-_Medium_Grip', 'Smith_Machine_Incline_Bench_Press', 'Leverage_Incline_Chest_Press']),
  ex('Decline Barbell Press', 'gym', 'Feet locked in, lower the bar to the bottom of the chest.', ['lower_chest'], ['triceps_lateral'], ['Decline_Barbell_Bench_Press', 'Smith_Machine_Decline_Press', 'Leverage_Decline_Chest_Press']),
  ex('Machine Chest Press', 'gym', 'Seat so the handles line up with mid-chest.', ['lower_chest'], ['upper_chest', 'front_delts', 'triceps_lateral'], ['Leverage_Chest_Press', 'Machine_Bench_Press', 'Cable_Chest_Press']),
  ex('Cable Fly', 'gym', 'Soft elbows, hug the handles together at chest height.', ['lower_chest', 'upper_chest'], ['front_delts'], ['Flat_Bench_Cable_Flyes', 'Butterfly']),
  ex('Low-to-high Cable Fly', 'gym', 'Pulleys low, sweep the handles up to chin height.', ['upper_chest'], ['front_delts'], ['Incline_Cable_Flye']),
  ex('Dumbbell Bench Press', 'dumbbell', 'Lower until the dumbbells reach chest level, press up and in.', ['lower_chest', 'upper_chest'], ['front_delts', 'triceps_lateral'], ['Dumbbell_Bench_Press']),
  ex('Incline Dumbbell Press', 'dumbbell', 'Bench at 30°, keep wrists stacked over elbows.', ['upper_chest'], ['front_delts', 'triceps_lateral'], ['Incline_Dumbbell_Press', 'Hammer_Grip_Incline_DB_Bench_Press']),
  ex('Dumbbell Fly', 'dumbbell', 'Wide arc, stop when you feel a stretch across the chest.', ['lower_chest'], ['upper_chest', 'front_delts'], ['Dumbbell_Flyes']),
  ex('Incline Dumbbell Fly', 'dumbbell', 'Bench at 30°, wide arc, squeeze at the top.', ['upper_chest'], ['front_delts'], ['Incline_Dumbbell_Flyes']),
  ex('Dumbbell Pullover', 'dumbbell', 'Lower behind the head with a slight elbow bend.', ['lats', 'lower_chest'], ['serratus', 'triceps_long'], ['Bent-Arm_Dumbbell_Pullover', 'Straight-Arm_Dumbbell_Pullover']),
  ex('Push-up', 'bodyweight', 'Body in one line, chest to a fist from the floor.', ['lower_chest'], ['upper_chest', 'front_delts', 'triceps_lateral', 'serratus'], ['Pushups']),
  ex('Decline Push-up', 'bodyweight', 'Feet on a bench to shift the work to the upper chest.', ['upper_chest'], ['front_delts', 'triceps_lateral'], ['Decline_Push-Up', 'Push-Ups_With_Feet_Elevated']),
  ex('Incline Push-up', 'bodyweight', 'Hands on a bench, lower the bottom of the chest to the edge.', ['lower_chest'], ['triceps_lateral'], ['Incline_Push-Up']),
  ex('Chest Dip', 'bodyweight', 'Lean forward and let elbows flare slightly.', ['lower_chest'], [...TRICEPS, 'front_delts'], ['Dips_-_Chest_Version']),
  ex('Smith Machine Incline Shoulder Raise', 'gym', 'Arms locked, push the bar up only by spreading the shoulder blades.', ['serratus'], [], ['Smith_Incline_Shoulder_Raise']),
  ex('Cable Serratus Punch', 'gym', 'Punch forward, then reach a little further without bending the elbow.', ['serratus'], ['front_delts']),
  ex('Dumbbell Incline Shoulder Raise', 'dumbbell', 'Arms straight up, raise the dumbbells by rounding the upper back.', ['serratus'], [], ['Dumbbell_Incline_Shoulder_Raise']),
  ex('Scap Push-up', 'bodyweight', 'Arms straight, sink between the shoulders then push the floor away.', ['serratus'], ['front_delts']),

  // Shoulders
  ex('Barbell Overhead Press', 'gym', 'Squeeze glutes, press the bar in a straight line overhead.', ['front_delts'], ['side_delts', ...TRICEPS, 'upper_traps'], ['Standing_Military_Press', 'Seated_Barbell_Military_Press', 'Smith_Machine_Overhead_Shoulder_Press']),
  ex('Machine Shoulder Press', 'gym', 'Handles start at chin level, don\'t lock out hard.', ['front_delts'], ['side_delts', 'triceps_lateral'], ['Machine_Shoulder_Military_Press', 'Leverage_Shoulder_Press', 'Seated_Cable_Shoulder_Press']),
  ex('Cable Lateral Raise', 'gym', 'Lead with the elbow, stop at shoulder height.', ['side_delts'], ['upper_traps'], ['Cable_Seated_Lateral_Raise', 'Bent_Over_Low-Pulley_Side_Lateral']),
  ex('Cable Front Raise', 'gym', 'Arm straight, raise the handle to eye level.', ['front_delts'], ['upper_chest'], ['Front_Cable_Raise']),
  ex('Rear Delt Fly Machine', 'gym', 'Arms nearly straight, sweep back until level with the body.', ['rear_delts'], ['mid_traps'], ['Reverse_Machine_Flyes', 'Cable_Rear_Delt_Fly']),
  ex('Face Pull', 'gym', 'Pull the rope to your forehead, elbows high.', ['rear_delts', 'mid_traps'], ['lower_traps'], ['Face_Pull', 'Cable_Rope_Rear-Delt_Rows']),
  ex('Seated Dumbbell Press', 'dumbbell', 'Back against the pad, press without arching.', ['front_delts'], ['side_delts', 'triceps_lateral'], ['Dumbbell_Shoulder_Press']),
  ex('Arnold Press', 'dumbbell', 'Rotate palms out as you press up.', ['front_delts'], ['side_delts', 'triceps_lateral'], ['Arnold_Dumbbell_Press']),
  ex('Dumbbell Lateral Raise', 'dumbbell', 'Slight bend in the elbow, raise out to the sides.', ['side_delts'], ['upper_traps'], ['Side_Lateral_Raise']),
  ex('Dumbbell Front Raise', 'dumbbell', 'Raise to eye level, no swinging.', ['front_delts'], ['upper_chest'], ['Front_Dumbbell_Raise']),
  ex('Bent-over Reverse Fly', 'dumbbell', 'Hinge forward, lift the arms out wide with soft elbows.', ['rear_delts'], ['mid_traps'], ['Reverse_Flyes', 'Seated_Bent-Over_Rear_Delt_Raise']),
  ex('Pike Push-up', 'bodyweight', 'Hips high, lower the top of your head toward the floor.', ['front_delts'], ['triceps_lateral', 'upper_traps'], ['Handstand_Push-Ups']),
  ex('Wall Handstand Hold', 'bodyweight', 'Stack wrists, shoulders and hips against the wall.', ['front_delts'], ['upper_traps', 'triceps_long']),

  // Arms
  ex('Barbell Curl', 'gym', 'Elbows pinned to your sides, no swinging.', ['biceps'], ['forearm_flexors'], ['Barbell_Curl', 'EZ-Bar_Curl', 'Wide-Grip_Standing_Barbell_Curl']),
  ex('Cable Curl', 'gym', 'Constant tension: control the way down.', ['biceps'], ['forearm_flexors'], ['Standing_Biceps_Cable_Curl', 'High_Cable_Curls', 'Cable_Hammer_Curls_-_Rope_Attachment']),
  ex('Preacher Curl Machine', 'gym', 'Full stretch at the bottom, squeeze at the top.', ['biceps'], [], ['Machine_Preacher_Curls', 'Machine_Bicep_Curl', 'Cable_Preacher_Curl']),
  ex('Dumbbell Curl', 'dumbbell', 'Supinate the wrist as you curl up.', ['biceps'], ['forearm_flexors'], ['Dumbbell_Bicep_Curl']),
  ex('Hammer Curl', 'dumbbell', 'Neutral grip, curl straight up.', ['biceps', 'forearm_extensors'], [], ['Hammer_Curls']),
  ex('Incline Dumbbell Curl', 'dumbbell', 'Arms hang behind the body for a deeper stretch.', ['biceps'], [], ['Incline_Dumbbell_Curl']),
  ex('Chin-up', 'bodyweight', 'Palms facing you, pull chest to the bar.', ['lats', 'biceps'], ['mid_traps', 'lower_traps'], ['Chin-Up']),
  ex('Cable Pushdown', 'gym', 'Elbows fixed at your sides, spread the rope at the bottom.', ['triceps_lateral'], ['triceps_long'], ['Triceps_Pushdown', 'Triceps_Pushdown_-_Rope_Attachment', 'Triceps_Pushdown_-_V-Bar_Attachment', 'Machine_Triceps_Extension']),
  ex('Close-grip Bench Press', 'gym', 'Hands shoulder-width, elbows tucked.', TRICEPS, ['lower_chest', 'front_delts'], ['Close-Grip_Barbell_Bench_Press', 'Smith_Machine_Close-Grip_Bench_Press']),
  ex('Overhead Cable Extension', 'gym', 'Face away from the stack, stretch behind the head.', ['triceps_long'], ['triceps_lateral'], ['Cable_Rope_Overhead_Triceps_Extension', 'Triceps_Overhead_Extension_with_Rope']),
  ex('Overhead Dumbbell Extension', 'dumbbell', 'Both hands on one dumbbell, elbows pointing up.', ['triceps_long'], ['triceps_lateral'], ['Standing_Dumbbell_Triceps_Extension']),
  ex('Dumbbell Kickback', 'dumbbell', 'Upper arm parallel to the floor, extend fully.', ['triceps_lateral'], ['triceps_long'], ['Tricep_Dumbbell_Kickback']),
  ex('Dumbbell Skull Crusher', 'dumbbell', 'Lower to the temples, elbows stay still.', TRICEPS, []),
  ex('Bench Dip', 'bodyweight', 'Hands on a bench behind you, elbows straight back.', ['triceps_lateral'], ['triceps_long', 'lower_chest', 'front_delts'], ['Bench_Dips']),
  ex('Diamond Push-up', 'bodyweight', 'Hands together under the chest.', ['triceps_lateral'], ['triceps_long', 'lower_chest'], ['Push-Ups_-_Close_Triceps_Position']),
  ex('Barbell Wrist Curl', 'gym', 'Forearms on the bench, curl only with the wrists.', ['forearm_flexors'], [], ['Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', 'Seated_Palm-Up_Barbell_Wrist_Curl']),
  ex('Reverse Barbell Wrist Curl', 'gym', 'Palms down, lift the back of the hands.', ['forearm_extensors'], [], ['Palms-Down_Wrist_Curl_Over_A_Bench', 'Seated_Palms-Down_Barbell_Wrist_Curl']),
  ex('Cable Reverse Curl', 'gym', 'Overhand grip, keep wrists straight.', ['biceps', 'forearm_extensors'], [], ['Reverse_Cable_Curl']),
  ex('Farmer\'s Carry', 'dumbbell', 'Heavy dumbbells, walk tall with a tight grip.', ['forearm_flexors'], ['upper_traps', 'obliques'], ['Farmers_Walk']),
  ex('Dumbbell Wrist Curl', 'dumbbell', 'Let the dumbbell roll to the fingers, then curl.', ['forearm_flexors'], [], ['Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench']),
  ex('Reverse Dumbbell Wrist Curl', 'dumbbell', 'Palms down, raise the knuckles only.', ['forearm_extensors'], [], ['Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench']),
  ex('Reverse Dumbbell Curl', 'dumbbell', 'Palms down the whole way.', ['biceps', 'forearm_extensors'], [], ['Standing_Dumbbell_Reverse_Curl']),
  ex('Dead Hang', 'bodyweight', 'Hang from a bar as long as you can.', ['forearm_flexors'], ['lats'], ['One_Handed_Hang']),
  ex('Fingertip Push-up Hold', 'bodyweight', 'Hold the top of a push-up on your fingertips.', ['forearm_flexors'], ['lower_chest']),

  // Core
  ex('Cable Crunch', 'gym', 'Kneel, curl the ribs toward the hips.', ['upper_abs'], ['lower_abs'], ['Cable_Crunch', 'Cable_Seated_Crunch', 'Standing_Rope_Crunch']),
  ex('Ab Crunch Machine', 'gym', 'Exhale fully as you crunch.', ['upper_abs'], ['lower_abs'], ['Ab_Crunch_Machine']),
  ex('Hanging Leg Raise', 'gym', 'Raise legs without swinging, tilt the pelvis up.', ['lower_abs', 'hip_flexors'], ['obliques'], ['Hanging_Leg_Raise']),
  ex('Captain\'s Chair Knee Raise', 'gym', 'Back on the pad, knees up to the chest.', ['hip_flexors', 'lower_abs'], [], ['Knee_Hip_Raise_On_Parallel_Bars']),
  ex('Cable Reverse Crunch', 'gym', 'Lying down, curl the hips off the floor against the cable.', ['lower_abs'], ['hip_flexors'], ['Cable_Reverse_Crunch']),
  ex('Cable Knee Drive', 'gym', 'Strap on the ankle, drive the knee up to hip height.', ['hip_flexors'], ['lower_abs']),
  ex('Weighted Crunch', 'dumbbell', 'Hold a dumbbell on the chest, short controlled range.', ['upper_abs'], [], ['Weighted_Crunches']),
  ex('Dumbbell V-up', 'dumbbell', 'Pass the dumbbell from hands to feet.', ['upper_abs', 'lower_abs'], ['hip_flexors']),
  ex('Crunch', 'bodyweight', 'Lift the shoulder blades, don\'t pull on the neck.', ['upper_abs'], [], ['Crunches']),
  ex('Reverse Crunch', 'bodyweight', 'Curl the hips off the floor, knees toward the chest.', ['lower_abs'], ['hip_flexors'], ['Reverse_Crunch']),
  ex('Lying Leg Raise', 'bodyweight', 'Lower back pressed down, lower the legs slowly.', ['lower_abs', 'hip_flexors'], [], ['Flat_Bench_Lying_Leg_Raise']),
  ex('Mountain Climber', 'bodyweight', 'Plank position, drive the knees in fast.', ['hip_flexors'], ['lower_abs', 'quads', 'front_delts'], ['Mountain_Climbers']),
  ex('Plank', 'bodyweight', 'Squeeze glutes, ribs down, hold.', ['upper_abs', 'lower_abs'], ['obliques', 'serratus'], ['Plank']),
  ex('Dead Bug', 'bodyweight', 'Lower back pressed into the floor the whole time.', ['lower_abs', 'upper_abs'], ['obliques'], ['Dead_Bug']),
  ex('Cable Woodchop', 'gym', 'Rotate through the torso, arms stay long.', ['obliques'], ['upper_abs'], ['Standing_Cable_Wood_Chop']),
  ex('Pallof Press', 'gym', 'Press the handle out and resist the rotation.', ['obliques'], ['upper_abs', 'lower_abs'], ['Pallof_Press', 'Pallof_Press_With_Rotation']),
  ex('Dumbbell Side Bend', 'dumbbell', 'One dumbbell, bend only sideways.', ['obliques'], ['lower_back'], ['Dumbbell_Side_Bend']),
  ex('Russian Twist', 'dumbbell', 'Lean back, turn the dumbbell side to side.', ['obliques'], ['upper_abs'], ['Russian_Twist']),
  ex('Side Plank', 'bodyweight', 'Hips high, body in a straight line.', ['obliques'], ['glute_med'], ['Side_Bridge']),
  ex('Bicycle Crunch', 'bodyweight', 'Elbow toward the opposite knee, slow tempo.', ['obliques', 'upper_abs'], ['hip_flexors'], ['Air_Bike']),
  ex('Plank Shoulder Tap', 'bodyweight', 'Keep hips square while tapping each shoulder.', ['obliques', 'upper_abs'], ['serratus', 'front_delts']),

  // Back
  ex('Barbell Shrug', 'gym', 'Shrug straight up, pause at the top.', ['upper_traps'], ['forearm_flexors'], ['Barbell_Shrug', 'Leverage_Shrug', 'Smith_Machine_Behind_the_Back_Shrug', 'Cable_Shrugs']),
  ex('Dumbbell Shrug', 'dumbbell', 'Arms long, lift the shoulders toward the ears.', ['upper_traps'], ['forearm_flexors'], ['Dumbbell_Shrug']),
  ex('Dumbbell Upright Row', 'dumbbell', 'Elbows lead, stop at chest height.', ['side_delts', 'upper_traps'], [], ['Standing_Dumbbell_Upright_Row']),
  ex('Lat Pulldown', 'gym', 'Pull the bar to the upper chest, elbows down and back.', ['lats'], ['biceps', 'lower_traps', 'rear_delts'], ['Wide-Grip_Lat_Pulldown', 'Close-Grip_Front_Lat_Pulldown', 'V-Bar_Pulldown', 'Underhand_Cable_Pulldowns', 'Full_Range-Of-Motion_Lat_Pulldown']),
  ex('Straight-arm Pulldown', 'gym', 'Arms straight, sweep the bar down to the thighs.', ['lats'], ['triceps_long'], ['Straight-Arm_Pulldown', 'Rope_Straight-Arm_Pulldown']),
  ex('Seated Cable Row', 'gym', 'Chest up, row to the belly button.', ['lats', 'mid_traps'], ['rear_delts', 'biceps'], ['Seated_Cable_Rows', 'Leverage_Iso_Row', 'Seated_One-arm_Cable_Pulley_Rows', 'Leverage_High_Row']),
  ex('Barbell Row', 'gym', 'Hinge to 45°, pull the bar to the lower ribs.', ['lats', 'mid_traps'], ['rear_delts', 'biceps', 'lower_back'], ['Bent_Over_Barbell_Row', 'T-Bar_Row_with_Handle', 'Smith_Machine_Bent_Over_Row']),
  ex('One-arm Dumbbell Row', 'dumbbell', 'Pull the elbow toward the hip.', ['lats', 'mid_traps'], ['rear_delts', 'biceps'], ['One-Arm_Dumbbell_Row']),
  ex('Chest-supported Dumbbell Row', 'dumbbell', 'Chest on an incline bench, no momentum.', ['mid_traps', 'lats'], ['rear_delts', 'biceps'], ['Dumbbell_Incline_Row']),
  ex('Incline Y Raise', 'dumbbell', 'Chest on an incline bench, light dumbbells up in a Y.', ['lower_traps'], ['side_delts', 'rear_delts']),
  ex('Pull-up', 'bodyweight', 'Overhand grip, chin over the bar.', ['lats'], ['biceps', 'lower_traps', 'mid_traps'], ['Pullups']),
  ex('Inverted Row', 'bodyweight', 'Body straight under a low bar, pull chest up.', ['mid_traps', 'lats'], ['rear_delts', 'biceps'], ['Inverted_Row']),
  ex('Scapular Pull-up', 'bodyweight', 'Hang, then pull the shoulder blades down without bending the arms.', ['lower_traps'], ['lats'], ['Scapular_Pull-Up']),
  ex('Prone Y Raise', 'bodyweight', 'Lying face down, lift arms in a Y.', ['lower_traps'], ['rear_delts']),
  ex('Back Extension', 'gym', 'Hinge at the hips, stop at a straight line.', ['lower_back'], ['glute_max', ...HAMSTRINGS], ['Hyperextensions_Back_Extensions', 'Reverse_Hyperextension']),
  ex('Barbell Deadlift', 'gym', 'Bar close to the shins, push the floor away.', ['glute_max', 'lower_back', ...HAMSTRINGS], ['quads', 'upper_traps', 'forearm_flexors'], ['Barbell_Deadlift', 'Trap_Bar_Deadlift', 'Sumo_Deadlift']),
  ex('Dumbbell Good Morning', 'dumbbell', 'Dumbbell on the chest, hinge with a flat back.', ['lower_back', ...HAMSTRINGS], ['glute_max']),
  ex('Superman', 'bodyweight', 'Lift arms and legs together, hold for a second.', ['lower_back'], ['glute_max'], ['Superman']),
  ex('Bird Dog', 'bodyweight', 'Opposite arm and leg, keep hips level.', ['lower_back'], ['glute_max', 'upper_abs']),

  // Legs
  ex('Barbell Back Squat', 'gym', 'Brace, sit down between the heels, knees track the toes.', ['quads', 'glute_max'], ['adductors', 'lower_back'], ['Barbell_Squat', 'Smith_Machine_Squat', 'Hack_Squat', 'Barbell_Full_Squat']),
  ex('Leg Press', 'gym', 'Lower until knees reach 90°, don\'t lift the hips.', ['quads'], ['glute_max', 'adductors'], ['Leg_Press', 'Narrow_Stance_Leg_Press', 'Smith_Machine_Leg_Press']),
  ex('Leg Extension', 'gym', 'Pause at the top, slow on the way down.', ['quads'], [], ['Leg_Extensions', 'Single-Leg_Leg_Extension']),
  ex('Goblet Squat', 'dumbbell', 'Dumbbell at the chest, elbows inside the knees.', ['quads'], ['glute_max', 'adductors', 'upper_abs'], ['Goblet_Squat']),
  ex('Dumbbell Lunge', 'dumbbell', 'Long step, back knee kisses the floor.', ['quads', 'glute_max'], ['adductors'], ['Dumbbell_Lunges']),
  ex('Dumbbell Front Squat', 'dumbbell', 'Dumbbells on the shoulders, stay upright.', ['quads'], ['glute_max'], ['Dumbbell_Squat']),
  ex('Air Squat', 'bodyweight', 'Hips below the knees, chest up.', ['quads'], ['glute_max'], ['Bodyweight_Squat']),
  ex('Walking Lunge', 'bodyweight', 'Step through with control, torso tall.', ['quads', 'glute_max'], ['adductors'], ['Bodyweight_Walking_Lunge']),
  ex('Wall Sit', 'bodyweight', 'Thighs parallel to the floor, hold.', ['quads'], []),
  ex('Barbell Hip Thrust', 'gym', 'Chin tucked, drive through the heels to full lockout.', ['glute_max'], HAMSTRINGS, ['Barbell_Hip_Thrust', 'Barbell_Glute_Bridge', 'Smith_Machine_Hip_Raise']),
  ex('Cable Kickback', 'gym', 'Kick back and slightly out, don\'t arch.', ['glute_max'], ['glute_med'], ['One-Legged_Cable_Kickback', 'Glute_Kickback']),
  ex('Dumbbell Hip Thrust', 'dumbbell', 'Dumbbell on the hips, squeeze at the top.', ['glute_max'], HAMSTRINGS),
  ex('Bulgarian Split Squat', 'dumbbell', 'Lean the torso forward to load the glutes.', ['quads', 'glute_max'], ['adductors', 'glute_med'], ['Split_Squat_with_Dumbbells']),
  ex('Dumbbell Step-up', 'dumbbell', 'Drive through the front heel.', ['quads', 'glute_max'], ['glute_med'], ['Dumbbell_Step_Ups']),
  ex('Glute Bridge', 'bodyweight', 'Feet close to the hips, squeeze hard at the top.', ['glute_max'], HAMSTRINGS, ['Butt_Lift_Bridge']),
  ex('Single-leg Glute Bridge', 'bodyweight', 'One foot down, keep hips level.', ['glute_max'], ['glute_med', ...HAMSTRINGS], ['Single_Leg_Glute_Bridge']),
  ex('Donkey Kick', 'bodyweight', 'On all fours, kick the heel to the ceiling.', ['glute_max'], []),
  ex('Hip Abduction Machine', 'gym', 'Lean forward a little, push out slowly.', ['glute_med'], ['glute_max'], ['Thigh_Abductor']),
  ex('Side-lying Dumbbell Leg Raise', 'dumbbell', 'Dumbbell on the outer thigh, raise the top leg with toes forward.', ['glute_med'], []),
  ex('Side-lying Leg Raise', 'bodyweight', 'Lying on your side, lift the top leg slightly behind you.', ['glute_med'], []),
  ex('Fire Hydrant', 'bodyweight', 'On all fours, lift the bent knee out to the side.', ['glute_med'], ['glute_max']),
  ex('Adductor Machine', 'gym', 'Squeeze the pads together, control the way out.', ['adductors'], [], ['Thigh_Adductor']),
  ex('Sumo Goblet Squat', 'dumbbell', 'Wide stance, toes out, dumbbell hanging between the legs.', ['adductors', 'quads', 'glute_max'], [], ['Plie_Dumbbell_Squat']),
  ex('Copenhagen Plank', 'bodyweight', 'Top leg on a bench, lift the hips and hold.', ['adductors'], ['obliques']),
  ex('Cossack Squat', 'bodyweight', 'Wide stance, sit into one leg with the other straight.', ['adductors', 'quads'], ['glute_max']),
  ex('Lying Leg Curl', 'gym', 'Hips pressed down. Toes in for the inner hamstrings, out for the outer.', HAMSTRINGS, ['gastrocnemius'], ['Lying_Leg_Curls', 'Standing_Leg_Curl']),
  ex('Seated Leg Curl', 'gym', 'Pad above the ankles, control the return.', HAMSTRINGS, ['gastrocnemius'], ['Seated_Leg_Curl']),
  ex('Barbell Romanian Deadlift', 'gym', 'Bar slides down the thighs, hips back.', [...HAMSTRINGS, 'glute_max'], ['lower_back'], ['Romanian_Deadlift', 'Stiff-Legged_Barbell_Deadlift', 'Smith_Machine_Stiff-Legged_Deadlift']),
  ex('Dumbbell Stiff-leg Deadlift', 'dumbbell', 'Legs nearly straight, feel the hamstring stretch.', [...HAMSTRINGS, 'glute_max'], ['lower_back'], ['Stiff-Legged_Dumbbell_Deadlift']),
  ex('Single-leg Dumbbell RDL', 'dumbbell', 'Hips square, reach the dumbbell to the floor.', [...HAMSTRINGS, 'glute_max'], ['glute_med']),
  ex('Nordic Curl', 'bodyweight', 'Anchor the heels, lower as slowly as you can.', HAMSTRINGS, ['gastrocnemius'], ['Natural_Glute_Ham_Raise']),
  ex('Single-leg Bridge Walkout', 'bodyweight', 'From a bridge, walk the heels out and back.', HAMSTRINGS, ['glute_max']),
  ex('Standing Calf Raise Machine', 'gym', 'Knees straight, full stretch at the bottom, pause at the top.', ['gastrocnemius'], ['soleus'], ['Standing_Calf_Raises', 'Smith_Machine_Calf_Raise', 'Calf_Press_On_The_Leg_Press_Machine', 'Donkey_Calf_Raises']),
  ex('Seated Calf Raise', 'gym', 'Knees bent at 90° to shift the work to the soleus.', ['soleus'], ['gastrocnemius'], ['Seated_Calf_Raise', 'Barbell_Seated_Calf_Raise']),
  ex('Tib Bar Raise', 'gym', 'Heels on the floor, lift the toes toward the shins.', ['tibialis'], [], ['Smith_Machine_Reverse_Calf_Raises']),
  ex('Dumbbell Calf Raise', 'dumbbell', 'Dumbbells in hand, knees straight, rise onto the balls of the feet.', ['gastrocnemius'], ['soleus'], ['Standing_Dumbbell_Calf_Raise']),
  ex('Seated Dumbbell Calf Raise', 'dumbbell', 'Dumbbell on the knee, heel drops below the step.', ['soleus'], [], ['Dumbbell_Seated_One-Leg_Calf_Raise']),
  ex('Seated Dumbbell Toe Raise', 'dumbbell', 'Dumbbell between the feet, lift the toes.', ['tibialis'], []),
  ex('Calf Raise', 'bodyweight', 'On a step, knees straight, drop the heels below the edge.', ['gastrocnemius'], ['soleus'], ['Calf_Raise_On_A_Dumbbell']),
  ex('Bent-knee Calf Raise', 'bodyweight', 'Knees bent, rise onto the toes to work the soleus.', ['soleus'], ['gastrocnemius']),
  ex('Jump Rope', 'bodyweight', 'Stay on the balls of the feet.', ['gastrocnemius'], ['soleus', 'quads'], ['Rope_Jumping']),
  ex('Wall Tibialis Raise', 'bodyweight', 'Back against a wall, heels forward, lift the toes.', ['tibialis'], []),
]
