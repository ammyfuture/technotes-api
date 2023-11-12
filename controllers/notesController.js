const Note = require("../models/Note");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// we get the note and the user model and we get asyncHandler
// async is being wrapped around our controllers lets see what it does later its from a library

// NOTE this seems to be a convention before each controller to set the main info
// @desc Get all notes
// @route GET /notes
// @access Private

// NOTE this is connected to the useGetNotesQuery
const getAllNotes = asyncHandler(async (req, res) => {
  // Get all notes from MongoDB
  // whats lean? anyway, thats the code we get the notes from the database here
  const notes = await Note.find().lean();

  // If no notes
  // if there is no notes found using if notes array has no length then
  if (!notes?.length) {
    // return this 400 and this msg
    return res.status(400).json({ message: "No notes found" });
  }

  // Add username to each note before sending the response
  // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE
  // You could also do this with a for...of loop

  // if notes found we pass it to this promise.All method and then we make map async? and we extract each note and we get the user model and use findById and pass each note.user prop  and then once done we return a new obj holding the note and a username from user.username
  // again note.user will get us an id and through it we will find the corresponding user obj and then we return to the requestor an obj with the requested notes and along side them the users name
  // so get gets us an obj with note obj and user name
  // note is spread, and username is now another prop there
  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );
  // sending the res once we have the obj we want
  res.json(notesWithUser);
});

// @desc Create new note
// @route POST /notes
// @access Private

// here we create a new one
// NOTE this is connected to the useCreateNotesMutation

const createNewNote = asyncHandler(async (req, res) => {
  // we receive here from the front
  // user and title and text from the new note form
  const { user, title, text } = req.body;

  // Confirm data
  // if there is none of these then we return an err msg
  if (!user || !title || !text) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check for duplicate title
  // making sure no duplicates by 1- using note.findOne and passing the title? so the titles cant be duplicate sin a note? why? if there is a title with the same title then duplicate will hold a value because it'll have i think the whole note obj?
  const duplicate = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // if its true then
  if (duplicate) {
    // err msg, duplicate note
    return res.status(409).json({ message: "Duplicate note title" });
  }

  // Create and store the new user
  // if all gucci tho we call create on note and pass our new values and make a note obj out of it
  const note = await Note.create({ user, title, text });

  // if note is now created then ...
  if (note) {
    // Created
    // send not created! so after creating and saving in database we confirm by sending a msg to front all is good
    return res.status(201).json({ message: "New note created" });
  } else {
    // otherwise we tell um hey didn't save for err reasons ..
    return res.status(400).json({ message: "Invalid note data received" });
  }
});

// @desc Update a note
// @route PATCH /notes
// @access Private
// NOTE this attaches to the update hook for notes
const updateNote = asyncHandler(async (req, res) => {
  // we get em all back ... id, user, title, text, completed
  // id is for the note, user is the id for the user
  const { id, user, title, text, completed } = req.body;

  // Confirm data
  // if any of this true err happened return msg to them
  if (!id || !user || !title || !text || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Confirm note exists to update
  // if checks out tho, then we get note and we find the note by id, get the note that is supposedly updated
  const note = await Note.findById(id).exec();

  // if note isn't there
  if (!note) {
    //   return err
    return res.status(400).json({ message: "Note not found" });
  }

  // Check for duplicate title
  // if note is duplicate in title then duplicate is true
  const duplicate = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  // Allow renaming of the original note
  // if duplicate returns something AND its not returning the current one we updated
  // if the duplicate._id to string isn't equal to id coming from the updating then return there is a duplicate because its possible the title is coming from the new update ...

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  // if all checks, all fields are filled, and there is a note indeed to update and the note title isn't duplicated then:
  // note.user is equal to the new user
  // note.title is equal to the new title
  // note.text is equal to the new text
  // and note.completed is equal to the new completed
  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  // updatedNote is equal to note.save so we are saving the changes and then saving it to this var
  const updatedNote = await note.save();
  // then we send a jsn with updatedNote.title is updated
  // why the title? where is this msg too we aren't using it
  res.json(`'${updatedNote.title}' updated`);
});

// @desc Delete a note
// @route DELETE /notes
// @access Private
// NOTE this is related to the get deleteNoteMutation
const deleteNote = asyncHandler(async (req, res) => {
  // we receive an id
  const { id } = req.body;

  // Confirm data
  // if the id isn't there err msg
  if (!id) {
    return res.status(400).json({ message: "Note ID required" });
  }

  // Confirm note exists to delete
  // we get the note we want using the id
  const note = await Note.findById(id).exec();
  // check if note is actually there if not err msg
  if (!note) {
    return res.status(400).json({ message: "Note not found" });
  }
  // we call the deleteOne on the note and save it in result
  const result = await note.deleteOne();

  // we create a replay var and send note with this title and id is deleted
  const reply = `Note '${result.title}' with ID ${result._id} deleted`;

  // send the replay here
  res.json(reply);
});

// exporting the controllers
// lets go to the route
module.exports = {
  getAllNotes,
  createNewNote,
  updateNote,
  deleteNote,
};

/*
lets understand the users controllers, these are the funcs that get executed when we get the diff requests
*/
