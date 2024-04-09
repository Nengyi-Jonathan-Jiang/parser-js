# Dysprosium

  - Dysprosium is supposed to be a sort of mix between C++, Java,
  and Rust
  - Strongly, statically typed
  - For simplicity, one "dbyte" = 32 bits (int and float size).
  This is the minimum addressable word size. Characters are also 
  encoded with 32 bits, because I'm lazy.
  - Supports operator overloading for most arithmetic operators
  - C# - like extension methods
  - Variables are const by default and must be converted to mut
  through the `mut` keyword. Const-ness works like as in C++
  - No raw pointers -- only c++ like unique and shared owning 
  pointers, and c++ reference-like non owning pointers
    - unique are denoted by `*`
    - shared are denoted by `#`
    - reference are denoted by `&`
    - Use `&` to take reference
    - Pointers and references can be nullable, denoted by `?`
    - Nullability can be taken off by adding `!`
    - Use `new*` and `new#` to create owning pointers
    - Use `new` for normal instantiation
    - Arrays are also built in, denoted by `[]`.
    - Arrays of non-nullable elements cannot be constructed
    directly and must be converted to non-nullable by a cast
  - Ownership:
    - Pointers can be owning (shared `#` or unique `*`), or 
    non-owning `&`.
    - Passing rules:

    |        | pass `*`    | pass `#`         | pass `&`  |
    |--------|-------------|------------------|-----------|
    | as `*` | Move        | Move into shared | Reference |
    | as `#` | Not allowed | Make new shared  | Reference |
    | as `&` | Not allowed | Not allowed      | Reference |

  - Dysprosium supports enum and flag classes
    - Must have only const methods and members. Enums may be 
  detected through `switch` statements and expressions; flags 
  can be used through `&` and `|`.
    - Flags may be larger than enums (may take up N >> 32)
    dbytes, where N is the number of flags. 
  - Switch statements exist.
  - Expression-based constructs are allowed. To use them,
  include the `yield` keyword or a direct value in each block.
  <br>
  (Temporary fix: to yield up a chain, use `yield yield ...`)
    - If expressions:
      ```
      if(condition_1)
          yield result_1;
      elif(condition_2) -> result_2;
      elif(condition_3) {
          ...
          yield result_3;
      }
      ...
      else
         yield result_N
      ```
    - Switch expressions:
      ```
      switch(expression){
         case 1 -> 5;
         case 2 -> {
             
         }
         default -> 6; 
      }
      ```
  - `for` and `while` are more or less like their counterparts in C++
  and Java.
    - "Enhanced `for`": 
      ```
      for(type variable of iterable) {
          ...
      }
      ```
    - For and while-else, taken from Python
      ```
      for(...) {
         ...
         break;
      }
      else {
         ...
      }
      ```
  - map, filter
  - Getter methods (must be const, taking no params)
    ```
    class Foo {
        public get int bar() const {
            return this.baz;
        }
    }
    ```
  - Generator functions and iterators
    - Iterator
      ```
      class Iota : std::Iterable<int> {
          private nextValue: int = 0;
          constructor(startValue: int) {
              nextValue = startValue;
          }
          public int next() override {
              return nextValue++;
          }
          public get int isFinished() const {
              return false;
          }
      }
      ```
    - Generator function (like python and js), syntax sugar
    
    
# HJeir

- HJeir is a relatively high level IR used by this Dysprosium compiler
- Perhaps similar to C
- Raw pointers and structs -- no references
- Use `new` to allocate memory
- 

# 