# Ficha
### *A collaborative shared space for designing and playing boardgames*

## Introduction

One of my hobbies is designing boardgames, but due to the global pandemic and resulting lockdown I can't actually play test any of them. So I created this tool to quickly prototype and play games online.

It's a 3D online space where you can quickly create cards, pieces, tiles, dice and the like using the editor tools, and everything is synchronised with all the other connected players.

It's like a stripped-back and open-source Tabletop Simulator with a simpler UI and no distracting physics. It's also similar to Tabletopia, but free and all the assets are self-hosted so that there's less "lock-in".

The networking is peer-to-peer so the sync is silky smooth.

Ficha is a work in progress and anyone is welcome to contribute. Get in touch if you have suggestions for features, or wanna contribute on the tech side!

Check it out [here](www.ficha.now.sh).

## Instructions

### Collaboration

#### Hosting
Click on the [You are hosting] button in the top right of the screen to copy the game id to the clip board. Share that with the other players.

#### Joining games
From the top left menu, select [Join game] and enter the game id given to you by the host.

### Editor
#### Camera
Use the mouse to move the camera around the scene.
* Pan - right click and drag
* Rotate - middle click and drag
* Zoom - scroll wheel


#### Adding objects
Right click on an empty space to open the menu, and select [Add object]. This will open the object editor.

There are currently 6 types of object that you can add:
* Card - a flat object that can have custom images or text. The default shape is like a card, but other shapes are available for making tile-like objects.
* Deck - a collection of cards
* Piece - a 3D object with custom shape, colour and size to represent the various tokens in the game
* Piece set - a collection of pieces
* Die - a die with custom faces and number of sides
* Board - a large flat image for use as a game board

As you edit the object you'll see a preview in the window. Use the mouse to rotate and zoom the view.

Click [Add] to add the object to the scene.

#### Editing objects
Right click on an object to open the menu, and select [Edit]. This will open the object editor. Click [Save] to save the changes.

#### Moving objects
Left click and drag to move objects.

#### Locking objects
Right click on the object and select [Lock]. Locked objects can't be moved or selected until unlocked. 

*Lock decks and piece sets to draw objects from them by dragging.*

#### Actions
Right click on an object to open the context menu. The options depends on the type of object. Some actions can be triggered with mouse gestures.

* **All objects**
  * Edit - opens the object editor
  * Duplicate - creates a copy of the object
  * Rotate clockwise / counter-clockwise - rotates the object 90 degrees in either direction
  * Lock / Unlock - locks or unlocks the object
  * Delete - deletes the object 
* **Deck**
  * Reset - removes all drawn cards from the scene, refills the deck and shuffles it
  * Save / restore deal - saves the positions of all drawn cards. You can then restore that deal with [Restore deal]
  * *Draw one* - draw the top card and places to the side 
    * *Trigger gesture - drag on a locked deck*
  * Flip - flips the deck
  * Shuffle - shuffles the deck
* **Card**
  * Flip - flips the card. 
    * *Trigger gesture - double click*
  * Return to deck - returns the card to the deck if it has one
* **Piece set**
  * Reset - removes all drawn pieces from the scene, refills the set and randomises it
  * Draw one - draw a piece places to the side 
    * *Trigger gesture - drag on a locked piece set*
  * Randomise - randomises the order of the pieces
* **Piece**
  * Return to set - returns the piece to the set if it has one
* **Die**
  * Roll - rolls the die
    * *Trigger gesture - double click*


#### Selecting multiple objects
Select multiple objects by drawing a box. Triggering an action from the context menu will do that action on all selected object.

#### Hand areas
TODO

#### Game setups
TODO

#### Game rules
TODO

#### Game settings
TODO

#### Exporting / importing
TODO

