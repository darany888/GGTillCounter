# Till Counter

Thanks to the original creator of the app https://morgandival.github.io/till-counter/

The link for this project: https://darany888.github.io/GGTillCounter/

We have recently moved from a POS that allows end of day cash up to one that have no cash coin functionality. One of the staff found this app useful so I have tweaked to fit the needs for a Cafe.

The app records the date and set the default float amount to $200 which can be changed. 
The user in charge of end of day count, can count each denominator separately which will tally up the total for each row and the final amount at the bottom. After subtracting the float amount, the Actual amount can be compared to what's expected, in our case it is the end of day receipts produced by the POS.This will give us a variance which allow a user to enter a reason for.

It will also give the final deposit breakdown based on the available denominator.
And finally, after all has been completed, there is an appscript that links to a Google Sheet which record all the values.

I kept the dimension small and remove all default zeros, so that this can easily be done on a cell phone quickly.

## Upgrades:

- [x] Add today's date
- [x] Default Reverse order
- [x] Default to NZD
- [x] Add Float Amount (Default to $200)
- [x] Add Expected Cash up that users can enter from the end of day receipts
- [x] Calculate Bank Deposit breakdown for the cash minus the float amount.
- [x] Add a text box for reason for variance.
- [x] Add ability to send to Google Sheet which allows for tracking.

Most of the readme below came from the original creator. Kudos to him for this. 

## How It's Made:

**Tech used:** React, TypeScript

Calculators are nice, but what happens if you make a mistake? You have to start all over again!

So I built this app to help me count up all of my dollarydoos!

React states keep track of the values entered, display a count of each denomination, and maintain a running total at the bottom.

Each currency option dynamically generates the relevant denominations and displays the symbols of that currency.


## Known Issues:

- Currently none, but if one is found, please let me know.

## Resolved Issues:

- Some values don't display their counts correctly: resolved by adding rounding when checking for modulus before displaying.
- Changing currencies carried existing values over to new currency: resolved by adding the same logic from the reset button to the currency selector onChange event.

## Lessons Learned:

- React states are tricky, but it is good to keep in mind that changing the state doesn't immediately force a re-render of the components.
- Also, passing props between parent and child components is not as difficult as it looks, so long as the types match up.
- Lifting states up is also a fairly straight forward process, again keeping in mind the types.
- Allowing for alternative currency symbols required reworking the denominations array into a currency object with the symbol as a string property and the denominations array as another property.
- It is a good idea to keep in mind when dealing with currency to work with integers and divide when necessary. Also, rounding is important when working with JS numbers and modulus.
- Resetting on currency change required duplication of the reset button logic, and I should work on learning how to pass functions to child components.
- Refactoring arrow functions was a fun exercise that made me think about writing more efficient but still legible code. (Implicit returns and ternary if statements)
- After doing some research, I've come to the realisation that the total does not need to be stored in a useState variable since I'm calling a function to add the fields together anyway. So I removed it.
- Discovered object literals as an alternative to switch statements. Much neater to implement, especially with big long lists like the different denominations.
- I've begun looking into writing unit tests for my React components. So far so good.
- Distillation of types from the components into their own file is something I've always wanted to learn, and now I have. There are a couple of types used in this project that were duplicated in a few places. That has been rectified by pullint them out in to their own types definition file.
