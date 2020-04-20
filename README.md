# BehaviourEngineer

Manipulate behaviours and conquer the world.


Explanation of the default "cheat" tree:
In every tick do:
- Repeat Observing nearby particles.
- Repeat Selector (stops when one child behaviour was successful)
  - Sequence (execute in order ; stop when one child behaviour fails)
    - Look for nearby food
    - Walk to nearby food
    - Eat targeted food
    - Split
  - Interuptor (runs the child behaviour and interupts it when the condition succeeds)
    - Random Walk
    - Not (Look for nearby food)

So in short:
Cells look for nearby stuff. 
If it finds food it walks to it and eats it then splits (if possible).
If it cannot do this randomly walk around until food is found.

**Important**: This has been developed and tested with Firefox 69 and Chrome 77. The game uses modern APIs which might be unavailable on older browsers. In case you encounter problems, please include your browser and version.
