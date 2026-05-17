import fs from 'fs';

async function updateState() {
  const response = await fetch('http://localhost:3021/api/state');
  if (!response.ok) {
    throw new Error(`Failed to fetch state: ${response.statusText}`);
  }
  const state = await response.json();

  let modified = false;

  for (const template of state.habitTemplates) {
    if (template.title.toLowerCase().includes('finish homework')) {
      template.isActive = false; // "remove finish homework daily from the list"
      modified = true;
      console.log('Disabled habit:', template.title);
    }
    if (template.title.toLowerCase().includes('clean room')) {
      template.frequency = 'weekly'; // "make clean the room task as weekly as well"
      modified = true;
      console.log('Made habit weekly:', template.title);
    }
  }

  if (modified) {
    const putResponse = await fetch('http://localhost:3021/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    if (!putResponse.ok) {
      throw new Error(`Failed to save state: ${putResponse.statusText}`);
    }
    console.log('State updated successfully.');
  } else {
    console.log('No modifications needed.');
  }
}

updateState().catch(console.error);
