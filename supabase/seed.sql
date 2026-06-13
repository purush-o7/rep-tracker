-- =====================================================================
-- Seed: exercise catalog (workouts + muscle group tags)
-- Idempotent: safe to run multiple times.
--   - workouts:     inserted only if no workout with the same name
--                   (case-insensitive) exists
--   - workout_tags: ON CONFLICT DO NOTHING on the (workout_id, tag_id) PK
-- Requires: tags seeded by migration 008 (biceps, triceps, back, legs,
--           chest, shoulders, core, cardio, glutes, forearms, full_body)
-- =====================================================================

-- 1. Workouts
INSERT INTO public.workouts (name, description)
SELECT v.name, v.description
FROM (VALUES
  -- Chest
  ('Barbell Bench Press', 'Lie flat on a bench and press the barbell from chest to lockout. The classic chest mass builder.'),
  ('Incline Barbell Bench Press', 'Bench press on a 30-45 degree incline to emphasize the upper chest.'),
  ('Decline Barbell Bench Press', 'Bench press on a decline to target the lower chest fibers.'),
  ('Dumbbell Bench Press', 'Flat press with dumbbells for a greater range of motion and balanced strength on both sides.'),
  ('Incline Dumbbell Press', 'Press dumbbells on an incline bench to build the upper chest.'),
  ('Dumbbell Chest Fly', 'Open the arms in a wide arc with a slight elbow bend, stretching and squeezing the chest.'),
  ('Cable Crossover', 'Bring cable handles together in front of the chest for constant tension and a strong peak contraction.'),
  ('Pec Deck Fly', 'Machine fly that isolates the chest with a fixed, safe movement path.'),
  ('Push-up', 'Bodyweight press keeping a straight line from head to heels. Scalable anywhere.'),
  ('Machine Chest Press', 'Guided pressing machine, great for beginners or burning out safely.'),
  ('Chest Dips', 'Dips with the torso leaning forward to shift the load onto the lower chest.'),

  -- Back
  ('Deadlift', 'Hip hinge lifting the barbell from the floor to standing. The heaviest full-posterior pull.'),
  ('Pull-up', 'Vertical bodyweight pull with an overhand grip until the chin clears the bar.'),
  ('Chin-up', 'Vertical pull with an underhand grip, hitting lats and biceps hard.'),
  ('Lat Pulldown', 'Cable pulldown to the upper chest, building lat width.'),
  ('Seated Cable Row', 'Horizontal cable row toward the waist, squeezing the shoulder blades together.'),
  ('Barbell Bent-over Row', 'Hinge at the hips with a flat back and row the bar to the lower ribcage.'),
  ('Single-arm Dumbbell Row', 'One hand braced on a bench, row the dumbbell to the hip. Fixes side-to-side imbalances.'),
  ('T-Bar Row', 'Chest-supported or landmine row for mid-back thickness.'),
  ('Straight-arm Pulldown', 'Pull the cable down with straight arms to isolate the lats.'),
  ('Inverted Row', 'Bodyweight row under a fixed bar, scalable by foot position.'),
  ('Rack Pull', 'Partial deadlift from knee height to overload the upper back and traps.'),
  ('Face Pull', 'Pull the rope toward the face with elbows high. Rear delts and upper-back health.'),
  ('Barbell Shrug', 'Elevate the shoulders straight up holding a heavy bar to build the traps.'),
  ('Dumbbell Shrug', 'Shrug straight up toward the ears with heavy dumbbells, squeezing the traps at the top.'),

  -- Shoulders
  ('Overhead Barbell Press', 'Standing strict press from the collarbone to overhead lockout. Total shoulder strength.'),
  ('Seated Dumbbell Shoulder Press', 'Press dumbbells overhead from ear level while seated, core braced.'),
  ('Arnold Press', 'Dumbbell press with rotation from palms-in to palms-forward, sweeping all three delt heads.'),
  ('Lateral Raise', 'Raise the arms out to the sides to shoulder height. Builds delt width.'),
  ('Front Raise', 'Raise the weight straight in front to shoulder height for the front delts.'),
  ('Rear Delt Fly', 'Hinge forward and open the arms wide to hit the rear delts.'),
  ('Cable Lateral Raise', 'Lateral raise on a cable for constant tension through the whole arc.'),
  ('Upright Row', 'Pull the bar up along the body to chest height, elbows leading.'),
  ('Machine Shoulder Press', 'Guided overhead press, great for controlled overload.'),

  -- Biceps
  ('Barbell Curl', 'Standing curl with a straight bar. The fundamental biceps mass move.'),
  ('EZ-Bar Curl', 'Curl with an angled bar for a more comfortable wrist position.'),
  ('Alternating Dumbbell Curl', 'Curl one arm at a time, rotating the palm up through the lift.'),
  ('Hammer Curl', 'Neutral-grip curl targeting the brachialis for arm thickness.'),
  ('Incline Dumbbell Curl', 'Curl while lying on an incline bench, stretching the long head of the biceps.'),
  ('Concentration Curl', 'Seated single-arm curl with the elbow braced on the thigh. Maximum isolation.'),
  ('Preacher Curl', 'Curl over a preacher pad to remove momentum entirely.'),
  ('Cable Curl', 'Biceps curl on a low cable for constant tension.'),

  -- Triceps
  ('Tricep Pushdown', 'Push the cable attachment down to full lockout, elbows pinned to the sides.'),
  ('Overhead Tricep Extension', 'Lower the weight behind the head and extend. Stretches the long head.'),
  ('Skull Crusher', 'Lying extension lowering the bar to the forehead, then extending to lockout.'),
  ('Close-Grip Bench Press', 'Bench press with a narrow grip to shift the load onto the triceps.'),
  ('Tricep Kickback', 'Hinge forward, upper arm parallel to the floor, extend to full lockout and squeeze.'),
  ('Bench Dips', 'Dips with hands on a bench behind you. Simple bodyweight triceps work.'),
  ('Diamond Push-up', 'Push-up with hands close together forming a diamond. Triceps-dominant.'),

  -- Legs
  ('Back Squat', 'Barbell on the upper back, squat to parallel or below. The king of leg exercises.'),
  ('Front Squat', 'Barbell racked on the front delts, keeping the torso upright. Quad-dominant.'),
  ('Goblet Squat', 'Hold one dumbbell vertically at the chest and squat deep. Perfect squat teacher.'),
  ('Leg Press', 'Press the sled away with control. Heavy quad and glute loading with back support.'),
  ('Romanian Deadlift', 'Push the hips back with a soft knee bend until the hamstrings stretch deeply.'),
  ('Bulgarian Split Squat', 'Rear foot elevated single-leg squat. Brutal and effective.'),
  ('Walking Lunge', 'Alternating forward lunges while moving across the floor.'),
  ('Reverse Lunge', 'Step backward into a lunge. Knee-friendly unilateral leg work.'),
  ('Leg Extension', 'Machine knee extension isolating the quadriceps.'),
  ('Leg Curl', 'Machine knee flexion isolating the hamstrings.'),
  ('Standing Calf Raise', 'Rise onto the toes as high as possible, pause, and lower to a full stretch.'),
  ('Seated Calf Raise', 'Calf raise with bent knees to target the soleus.'),
  ('Sumo Squat', 'Wide-stance squat hitting the inner thighs and glutes.'),
  ('Hack Squat', 'Machine squat on an angled sled for quad focus.'),
  ('Step-up', 'Step onto a box driving through the front heel.'),

  -- Glutes
  ('Barbell Hip Thrust', 'Shoulders on a bench, drive the hips up against a loaded barbell. Top glute builder.'),
  ('Glute Bridge', 'Floor-based hip extension squeezing the glutes hard at the top.'),
  ('Cable Glute Kickback', 'Kick one leg back against cable resistance, squeezing the glute.'),
  ('Sumo Deadlift', 'Wide-stance deadlift emphasizing glutes and inner thighs.'),
  ('Lateral Band Walk', 'Side steps against band resistance to fire up the glute medius.'),

  -- Core
  ('Plank', 'Hold a straight line from head to heels on the forearms. Total core endurance.'),
  ('Side Plank', 'Plank on one forearm, hips high, working the obliques.'),
  ('Crunch', 'Curl the shoulder blades off the floor, exhaling at the top.'),
  ('Bicycle Crunch', 'Alternate elbow to opposite knee in a controlled pedaling motion.'),
  ('Hanging Leg Raise', 'Hang from a bar and raise straight legs to hip height or above.'),
  ('Lying Leg Raise', 'Raise straight legs to 90 degrees, lowering slowly without touching the floor.'),
  ('Russian Twist', 'Seated rotation side to side, feet elevated for extra challenge.'),
  ('Dead Bug', 'Lower opposite arm and leg while keeping the lower back glued to the floor.'),
  ('Ab Wheel Rollout', 'Roll the wheel forward keeping the core braced, then pull back.'),
  ('Cable Woodchopper', 'Rotational cable pull across the body, from high to low.'),
  ('Mountain Climbers', 'Drive the knees toward the chest rapidly from a push-up position.'),
  ('Superman Hold', 'Lying face down, lift arms, chest and legs, squeezing the lower back and glutes.'),
  ('Dumbbell Side Bend', 'Bend sideways holding a dumbbell, returning upright with the opposite oblique.'),

  -- Forearms
  ('Wrist Curl', 'Forearms on thighs, curl the wrists up. Builds the forearm flexors.'),
  ('Reverse Wrist Curl', 'Palms down, extend the wrists upward. Balances the forearm extensors.'),
  ('Reverse Curl', 'Curl with an overhand grip, loading the brachioradialis and forearms.'),
  ('Farmer''s Carry', 'Walk holding heavy weights at the sides. Grip, traps and core in one move.'),
  ('Plate Pinch', 'Pinch-grip plates together and hold for time. Raw grip strength.'),

  -- Cardio
  ('Treadmill Run', 'Steady-state or interval running on the treadmill.'),
  ('Rowing Machine', 'Full-body cardio pulling on the erg: legs, back and arms.'),
  ('Jump Rope', 'Skipping intervals for footwork, calves and conditioning.'),
  ('Cycling', 'Stationary bike session, steady or intervals.'),
  ('Stair Climber', 'Climbing machine for legs and lungs.'),
  ('Elliptical', 'Low-impact full-body cardio machine.'),
  ('Burpees', 'Squat, kick back to a push-up, jump up. Full-body conditioning in one move.'),
  ('High Knees', 'Run in place driving the knees to hip height.'),
  ('Jumping Jacks', 'Classic full-body warm-up jump.'),
  ('Box Jump', 'Explosive jump onto a box, landing soft.'),

  -- Full body
  ('Kettlebell Swing', 'Explosive hip hinge swinging the kettlebell to chest height.'),
  ('Clean and Press', 'Pull the weight from the floor to the shoulders, then press overhead.'),
  ('Thruster', 'Front squat flowing directly into an overhead press.'),
  ('Squat to Press', 'Dumbbell squat driving up into an overhead press in one motion.'),
  ('Turkish Get-up', 'Rise from lying to standing while holding a weight locked out overhead.'),
  ('Man Maker', 'Row in plank, push-up, then clean and press the dumbbells. Everything at once.')
) AS v(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.workouts w WHERE lower(w.name) = lower(v.name)
);

-- 2. Workout <-> tag mapping
INSERT INTO public.workout_tags (workout_id, tag_id)
SELECT w.id, t.id
FROM (VALUES
  ('Barbell Bench Press', 'chest'), ('Barbell Bench Press', 'triceps'),
  ('Incline Barbell Bench Press', 'chest'), ('Incline Barbell Bench Press', 'shoulders'),
  ('Decline Barbell Bench Press', 'chest'),
  ('Dumbbell Bench Press', 'chest'), ('Dumbbell Bench Press', 'triceps'),
  ('Incline Dumbbell Press', 'chest'), ('Incline Dumbbell Press', 'shoulders'),
  ('Dumbbell Chest Fly', 'chest'),
  ('Cable Crossover', 'chest'),
  ('Pec Deck Fly', 'chest'),
  ('Push-up', 'chest'), ('Push-up', 'triceps'), ('Push-up', 'core'),
  ('Machine Chest Press', 'chest'),
  ('Chest Dips', 'chest'), ('Chest Dips', 'triceps'),

  ('Deadlift', 'back'), ('Deadlift', 'legs'), ('Deadlift', 'full_body'),
  ('Pull-up', 'back'), ('Pull-up', 'biceps'),
  ('Chin-up', 'back'), ('Chin-up', 'biceps'),
  ('Lat Pulldown', 'back'),
  ('Seated Cable Row', 'back'),
  ('Barbell Bent-over Row', 'back'),
  ('Single-arm Dumbbell Row', 'back'),
  ('T-Bar Row', 'back'),
  ('Straight-arm Pulldown', 'back'),
  ('Inverted Row', 'back'),
  ('Rack Pull', 'back'),
  ('Face Pull', 'shoulders'), ('Face Pull', 'back'),
  ('Barbell Shrug', 'back'),
  ('Dumbbell Shrug', 'back'),

  ('Overhead Barbell Press', 'shoulders'), ('Overhead Barbell Press', 'triceps'),
  ('Seated Dumbbell Shoulder Press', 'shoulders'),
  ('Arnold Press', 'shoulders'),
  ('Lateral Raise', 'shoulders'),
  ('Front Raise', 'shoulders'),
  ('Rear Delt Fly', 'shoulders'), ('Rear Delt Fly', 'back'),
  ('Cable Lateral Raise', 'shoulders'),
  ('Upright Row', 'shoulders'),
  ('Machine Shoulder Press', 'shoulders'),

  ('Barbell Curl', 'biceps'),
  ('EZ-Bar Curl', 'biceps'),
  ('Alternating Dumbbell Curl', 'biceps'),
  ('Hammer Curl', 'biceps'), ('Hammer Curl', 'forearms'),
  ('Incline Dumbbell Curl', 'biceps'),
  ('Concentration Curl', 'biceps'),
  ('Preacher Curl', 'biceps'),
  ('Cable Curl', 'biceps'),

  ('Tricep Pushdown', 'triceps'),
  ('Overhead Tricep Extension', 'triceps'),
  ('Skull Crusher', 'triceps'),
  ('Close-Grip Bench Press', 'triceps'), ('Close-Grip Bench Press', 'chest'),
  ('Tricep Kickback', 'triceps'),
  ('Bench Dips', 'triceps'),
  ('Diamond Push-up', 'triceps'), ('Diamond Push-up', 'chest'),

  ('Back Squat', 'legs'), ('Back Squat', 'glutes'),
  ('Front Squat', 'legs'), ('Front Squat', 'core'),
  ('Goblet Squat', 'legs'), ('Goblet Squat', 'glutes'),
  ('Leg Press', 'legs'), ('Leg Press', 'glutes'),
  ('Romanian Deadlift', 'legs'), ('Romanian Deadlift', 'glutes'),
  ('Bulgarian Split Squat', 'legs'), ('Bulgarian Split Squat', 'glutes'),
  ('Walking Lunge', 'legs'), ('Walking Lunge', 'glutes'),
  ('Reverse Lunge', 'legs'), ('Reverse Lunge', 'glutes'),
  ('Leg Extension', 'legs'),
  ('Leg Curl', 'legs'),
  ('Standing Calf Raise', 'legs'),
  ('Seated Calf Raise', 'legs'),
  ('Sumo Squat', 'legs'), ('Sumo Squat', 'glutes'),
  ('Hack Squat', 'legs'),
  ('Step-up', 'legs'), ('Step-up', 'glutes'),

  ('Barbell Hip Thrust', 'glutes'), ('Barbell Hip Thrust', 'legs'),
  ('Glute Bridge', 'glutes'),
  ('Cable Glute Kickback', 'glutes'),
  ('Sumo Deadlift', 'glutes'), ('Sumo Deadlift', 'legs'), ('Sumo Deadlift', 'back'),
  ('Lateral Band Walk', 'glutes'),

  ('Plank', 'core'),
  ('Side Plank', 'core'),
  ('Crunch', 'core'),
  ('Bicycle Crunch', 'core'),
  ('Hanging Leg Raise', 'core'),
  ('Lying Leg Raise', 'core'),
  ('Russian Twist', 'core'),
  ('Dead Bug', 'core'),
  ('Ab Wheel Rollout', 'core'),
  ('Cable Woodchopper', 'core'),
  ('Mountain Climbers', 'core'), ('Mountain Climbers', 'cardio'),
  ('Superman Hold', 'core'), ('Superman Hold', 'back'),
  ('Dumbbell Side Bend', 'core'),

  ('Wrist Curl', 'forearms'),
  ('Reverse Wrist Curl', 'forearms'),
  ('Reverse Curl', 'forearms'), ('Reverse Curl', 'biceps'),
  ('Farmer''s Carry', 'forearms'), ('Farmer''s Carry', 'full_body'),
  ('Plate Pinch', 'forearms'),

  ('Treadmill Run', 'cardio'),
  ('Rowing Machine', 'cardio'), ('Rowing Machine', 'full_body'),
  ('Jump Rope', 'cardio'),
  ('Cycling', 'cardio'),
  ('Stair Climber', 'cardio'), ('Stair Climber', 'legs'),
  ('Elliptical', 'cardio'),
  ('Burpees', 'cardio'), ('Burpees', 'full_body'),
  ('High Knees', 'cardio'),
  ('Jumping Jacks', 'cardio'),
  ('Box Jump', 'cardio'), ('Box Jump', 'legs'),

  ('Kettlebell Swing', 'full_body'), ('Kettlebell Swing', 'glutes'),
  ('Clean and Press', 'full_body'), ('Clean and Press', 'shoulders'),
  ('Thruster', 'full_body'), ('Thruster', 'legs'), ('Thruster', 'shoulders'),
  ('Squat to Press', 'full_body'), ('Squat to Press', 'legs'), ('Squat to Press', 'shoulders'),
  ('Turkish Get-up', 'full_body'), ('Turkish Get-up', 'core'),
  ('Man Maker', 'full_body')
) AS m(workout_name, tag_name)
JOIN public.workouts w ON lower(w.name) = lower(m.workout_name)
JOIN public.tags t ON t.name = m.tag_name
ON CONFLICT (workout_id, tag_id) DO NOTHING;

-- 3. YouTube tutorial videos
-- Only fills workouts whose youtube_url is still NULL, so manual edits
-- made in the admin panel are never overwritten.
UPDATE public.workouts w
SET youtube_url = v.url
FROM (VALUES
  ('Barbell Bench Press', 'https://www.youtube.com/watch?v=gRVjAtPip0Y'),
  ('Incline Barbell Bench Press', 'https://www.youtube.com/watch?v=SrqOu55lrYU'),
  ('Decline Barbell Bench Press', 'https://www.youtube.com/watch?v=LfyQBUKR8SE'),
  ('Dumbbell Bench Press', 'https://www.youtube.com/watch?v=t1iaVBMItPo'),
  ('Incline Dumbbell Press', 'https://www.youtube.com/watch?v=hChjZQhX1Ls'),
  ('Dumbbell Chest Fly', 'https://www.youtube.com/watch?v=n7tC3xiaLzE'),
  ('Cable Crossover', 'https://www.youtube.com/watch?v=XY6JrX1wyxk'),
  ('Pec Deck Fly', 'https://www.youtube.com/watch?v=H4mVGHaK2f4'),
  ('Push-up', 'https://www.youtube.com/watch?v=IODxDxX7oi4'),
  ('Machine Chest Press', 'https://www.youtube.com/watch?v=pLofEAcfsO8'),
  ('Chest Dips', 'https://www.youtube.com/watch?v=yN6Q1UI_xkE'),
  ('Deadlift', 'https://www.youtube.com/watch?v=XxWcirHIwVo'),
  ('Pull-up', 'https://www.youtube.com/watch?v=vw5Xmu5CIew'),
  ('Chin-up', 'https://www.youtube.com/watch?v=e1YSApl-QcM'),
  ('Lat Pulldown', 'https://www.youtube.com/watch?v=CAwf7n6Luuc'),
  ('Seated Cable Row', 'https://www.youtube.com/watch?v=sP_4vybjVJs'),
  ('Barbell Bent-over Row', 'https://www.youtube.com/watch?v=kBWAon7ItDw'),
  ('Single-arm Dumbbell Row', 'https://www.youtube.com/watch?v=gfUg6qWohTk'),
  ('T-Bar Row', 'https://www.youtube.com/watch?v=TyLoy3n_a10'),
  ('Straight-arm Pulldown', 'https://www.youtube.com/watch?v=eKJUJ2eFPUY'),
  ('Inverted Row', 'https://www.youtube.com/watch?v=GdyhjXlxE-U'),
  ('Rack Pull', 'https://www.youtube.com/watch?v=aAjN8zS7Idg'),
  ('Face Pull', 'https://www.youtube.com/watch?v=eTCBSFlCJ_s'),
  ('Barbell Shrug', 'https://www.youtube.com/watch?v=KbsQ1E8Hg0o'),
  ('Dumbbell Shrug', 'https://www.youtube.com/watch?v=8L6zjxBwVzM'),
  ('Overhead Barbell Press', 'https://www.youtube.com/watch?v=-5MmFTKLC-0'),
  ('Seated Dumbbell Shoulder Press', 'https://www.youtube.com/watch?v=E9ShwbwZ1zw'),
  ('Arnold Press', 'https://www.youtube.com/watch?v=6Z15_WdXmVw'),
  ('Lateral Raise', 'https://www.youtube.com/watch?v=3VcKaXpzqRo'),
  ('Front Raise', 'https://www.youtube.com/watch?v=vOqq8BfT3gQ'),
  ('Rear Delt Fly', 'https://www.youtube.com/watch?v=buuYPLVXsJg'),
  ('Cable Lateral Raise', 'https://www.youtube.com/watch?v=zpbm-xRHB6k'),
  ('Upright Row', 'https://www.youtube.com/watch?v=jaAV-rD45I0'),
  ('Machine Shoulder Press', 'https://www.youtube.com/watch?v=3R14MnZbcpw'),
  ('Barbell Curl', 'https://www.youtube.com/watch?v=JJB8XgKltA8'),
  ('EZ-Bar Curl', 'https://www.youtube.com/watch?v=5NsFLGUf0Fo'),
  ('Alternating Dumbbell Curl', 'https://www.youtube.com/watch?v=M2Nbw9tunoY'),
  ('Hammer Curl', 'https://www.youtube.com/watch?v=BRVDS6HVR9Q'),
  ('Incline Dumbbell Curl', 'https://www.youtube.com/watch?v=1gCfaEWk_Ds'),
  ('Concentration Curl', 'https://www.youtube.com/watch?v=0AUGkch3tzc'),
  ('Preacher Curl', 'https://www.youtube.com/watch?v=BPmUhDtdQfw'),
  ('Cable Curl', 'https://www.youtube.com/watch?v=5z4y7QRTx1w'),
  ('Tricep Pushdown', 'https://www.youtube.com/watch?v=ozwo9RGm7QU'),
  ('Overhead Tricep Extension', 'https://www.youtube.com/watch?v=W6h3t9mkRrY'),
  ('Skull Crusher', 'https://www.youtube.com/watch?v=9baX4-wEYx8'),
  ('Close-Grip Bench Press', 'https://www.youtube.com/watch?v=UYJsFzqdgK4'),
  ('Tricep Kickback', 'https://www.youtube.com/watch?v=uRpIUeoS4ac'),
  ('Bench Dips', 'https://www.youtube.com/watch?v=WVeZDBhZwLA'),
  ('Diamond Push-up', 'https://www.youtube.com/watch?v=J0DnG1_S92I'),
  ('Back Squat', 'https://www.youtube.com/watch?v=gcNh17Ckjgg'),
  ('Front Squat', 'https://www.youtube.com/watch?v=wyDbagKS7Rg'),
  ('Goblet Squat', 'https://www.youtube.com/watch?v=BR4tlEE_A98'),
  ('Leg Press', 'https://www.youtube.com/watch?v=cDGOn-yfKJA'),
  ('Romanian Deadlift', 'https://www.youtube.com/watch?v=uhghy9pFIPY'),
  ('Bulgarian Split Squat', 'https://www.youtube.com/watch?v=hiLF_pF3EJM'),
  ('Walking Lunge', 'https://www.youtube.com/watch?v=Pbmj6xPo-Hw'),
  ('Reverse Lunge', 'https://www.youtube.com/watch?v=GcYirgCLhnI'),
  ('Leg Extension', 'https://www.youtube.com/watch?v=tTbJBUKnWU8'),
  ('Leg Curl', 'https://www.youtube.com/watch?v=P7-RxTVe6O0'),
  ('Standing Calf Raise', 'https://www.youtube.com/watch?v=SVtg-1loH4c'),
  ('Seated Calf Raise', 'https://www.youtube.com/watch?v=I1uQtobaNRQ'),
  ('Sumo Squat', 'https://www.youtube.com/watch?v=kjlfpqXnyL8'),
  ('Hack Squat', 'https://www.youtube.com/watch?v=hglQExHCM9Q'),
  ('Step-up', 'https://www.youtube.com/watch?v=aKj-6hgiViA'),
  ('Barbell Hip Thrust', 'https://www.youtube.com/watch?v=S_uZP4UH6J0'),
  ('Glute Bridge', 'https://www.youtube.com/watch?v=wPM8icPu6H8'),
  ('Cable Glute Kickback', 'https://www.youtube.com/watch?v=bVrmtCI00Ys'),
  ('Sumo Deadlift', 'https://www.youtube.com/watch?v=cDlOSfu-zHY'),
  ('Lateral Band Walk', 'https://www.youtube.com/watch?v=y_bqFDQZSHQ'),
  ('Wrist Curl', 'https://www.youtube.com/watch?v=SqwIBiru46w'),
  ('Reverse Wrist Curl', 'https://www.youtube.com/watch?v=SfENsl5klVA'),
  ('Reverse Curl', 'https://www.youtube.com/watch?v=pXx38ZWRYjo'),
  ('Farmer''s Carry', 'https://www.youtube.com/watch?v=VBobkldqqvk'),
  ('Plate Pinch', 'https://www.youtube.com/watch?v=jFTV3DQf3HE'),
  ('Plank', 'https://www.youtube.com/watch?v=A2b2EmIg0dA'),
  ('Side Plank', 'https://www.youtube.com/watch?v=44ND4bOB-T0'),
  ('Crunch', 'https://www.youtube.com/watch?v=GWIEON0VSaY'),
  ('Bicycle Crunch', 'https://www.youtube.com/watch?v=wpRI3xBhJmo'),
  ('Hanging Leg Raise', 'https://www.youtube.com/watch?v=Pr1ieGZ5atk'),
  ('Lying Leg Raise', 'https://www.youtube.com/watch?v=sY2ZgV2Sj_s'),
  ('Russian Twist', 'https://www.youtube.com/watch?v=fPxO-FA8acM'),
  ('Dead Bug', 'https://www.youtube.com/watch?v=bxn9FBrt4-A'),
  ('Ab Wheel Rollout', 'https://www.youtube.com/watch?v=j6lR4u193gE'),
  ('Cable Woodchopper', 'https://www.youtube.com/watch?v=he4IhLc1d5k'),
  ('Mountain Climbers', 'https://www.youtube.com/watch?v=ixxk9Qfn61o'),
  ('Superman Hold', 'https://www.youtube.com/watch?v=g0Kr9Wd3CeQ'),
  ('Dumbbell Side Bend', 'https://www.youtube.com/watch?v=UUQHeBRE_Wo'),
  ('Treadmill Run', 'https://www.youtube.com/watch?v=aKfJJ1TuyE4'),
  ('Rowing Machine', 'https://www.youtube.com/watch?v=4zWu1yuJ0_g'),
  ('Jump Rope', 'https://www.youtube.com/watch?v=s-8tbwbEZ68'),
  ('Cycling', 'https://www.youtube.com/watch?v=uHueJIjyRag'),
  ('Stair Climber', 'https://www.youtube.com/watch?v=Zn1O9LcKW9E'),
  ('Elliptical', 'https://www.youtube.com/watch?v=sHMemwz_HPU'),
  ('Burpees', 'https://www.youtube.com/watch?v=qLBImHhCXSw'),
  ('High Knees', 'https://www.youtube.com/watch?v=D0GwAezTvtg'),
  ('Jumping Jacks', 'https://www.youtube.com/watch?v=uLVt6u15L98'),
  ('Box Jump', 'https://www.youtube.com/watch?v=YLPQsdRDmB0'),
  ('Kettlebell Swing', 'https://www.youtube.com/watch?v=sSESeQAir2M'),
  ('Clean and Press', 'https://www.youtube.com/watch?v=r8vi2RqW5qg'),
  ('Thruster', 'https://www.youtube.com/watch?v=z0PGxb8BSq8'),
  ('Squat to Press', 'https://www.youtube.com/watch?v=MAsd-y4Q9iU'),
  ('Turkish Get-up', 'https://www.youtube.com/watch?v=0bWRPC49-KI'),
  ('Man Maker', 'https://www.youtube.com/watch?v=2-6EPLtSLwU')
) AS v(name, url)
WHERE lower(w.name) = lower(v.name)
  AND w.youtube_url IS NULL;

-- 4. Log types for non rep-based exercises (default is 'weight_reps')
UPDATE public.workouts SET log_type = 'duration'
WHERE lower(name) IN (
  'plank', 'side plank', 'superman hold', 'plate pinch', 'farmer''s carry',
  'jump rope', 'stair climber', 'elliptical', 'high knees', 'jumping jacks',
  'mountain climbers'
) AND log_type <> 'duration';

UPDATE public.workouts SET log_type = 'distance'
WHERE lower(name) IN ('treadmill run', 'rowing machine', 'cycling')
  AND log_type <> 'distance';

-- 5. Additional exercises (from Manoj tracker-2): Hyperextension, Cable Crunch
INSERT INTO public.workouts (name, description, youtube_url)
SELECT v.name, v.description, v.url
FROM (VALUES
  ('Hyperextension (Back Extension)', 'Hinge forward over a back-extension bench, then raise your torso until it is in line with your legs, squeezing the lower back and glutes at the top. Builds the posterior chain and bulletproofs the lower back for heavy hinges.', 'https://www.youtube.com/watch?v=CgbmrF-DRSE'),
  ('Cable Crunch', 'Kneel facing a high cable holding the rope beside your head, then crunch down by contracting the abs against the load — hips stay fixed, only the spine flexes. A weighted ab builder you can progressively overload.', 'https://www.youtube.com/watch?v=809A_MuZ2PY')
) AS v(name, description, url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.workouts w WHERE lower(w.name) = lower(v.name)
);

INSERT INTO public.workout_tags (workout_id, tag_id)
SELECT w.id, t.id
FROM (VALUES
  ('Hyperextension (Back Extension)', 'back'),
  ('Hyperextension (Back Extension)', 'glutes'),
  ('Cable Crunch', 'core')
) AS m(workout_name, tag_name)
JOIN public.workouts w ON lower(w.name) = lower(m.workout_name)
JOIN public.tags t ON t.name = m.tag_name
ON CONFLICT (workout_id, tag_id) DO NOTHING;
