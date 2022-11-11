export function plusOne(a) {
  return a+1;
}

export function minusOne(a) {
  return a-1;
}

export function constantFunction(a) {
  return a;
}

export function inRange(number) {
  if (0 < number && number <= 8) {
      return true;
  } else {
      return false;
  }
}

export function signChecker(number) {
  if (number < 0) {
      return minusOne;
  }
  if (number > 0) {
      return plusOne;
  } 
  else {
      return constantFunction;
  }
}