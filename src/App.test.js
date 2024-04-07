import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import App from "./App";
import Item from "./components/item";
import List from "./components/list";

// test 1 unit test, blackbox test, smoke test
test('fetches and renders province data', async () => {
  const mockSuccessResponse = [
    {
      "name": "Ontario",
      "capital": "Toronto",
      "flagUrl": "https://upload.wikimedia.org/wikipedia/commons/8/88/Flag_of_Ontario.svg"
    },
    {
      "name": "Quebec",
      "capital": "Quebec City",
      "flagUrl": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Flag_of_Quebec.svg"
    },
    {
      "name": "Nova Scotia",
      "capital": "Halifax",
      "flagUrl": "https://upload.wikimedia.org/wikipedia/commons/c/c0/Flag_of_Nova_Scotia.svg"
    }
  ];

  const mockJsonPromise = Promise.resolve(mockSuccessResponse);
  const mockFetchPromise = Promise.resolve({
    json: () => mockJsonPromise,
  });

  // Mock the global fetch function
  global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);

  render(<App />);

  const ontarioElement = await screen.findByText("Ontario");
  expect(ontarioElement).toBeInTheDocument();

  const quebecElement = await screen.findByText("Quebec");
  expect(quebecElement).toBeInTheDocument();

  const novaScotiaElement = await screen.findByText("Nova Scotia");
  expect(novaScotiaElement).toBeInTheDocument();

  // Restore
  global.fetch.mockRestore();
});

// test 2, whitebox test, unit test
test('button click changes state and text of Capitals in the item list', () => {
  const mockData = {
    name: 'Ontario',
    capital: 'Toronto',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Flag_of_Ontario.svg'
  };

  render(<Item {...mockData} />);

  // Check initial state
  expect(screen.getByText('Show Capital')).toBeInTheDocument();
  expect(screen.queryByText('Toronto')).toBeNull();

  fireEvent.click(screen.getByText('Show Capital'));

  expect(screen.getByText('Hide Capital')).toBeInTheDocument();
  expect(screen.getByText('Toronto')).toBeInTheDocument();

  // Click the button again to see if it can restore to initial view
  fireEvent.click(screen.getByText('Hide Capital'));

  expect(screen.getByText('Show Capital')).toBeInTheDocument();
  expect(screen.queryByText('Toronto')).toBeNull();
});

// test 3, unit test, whitebox, error msg test, assume that an error msg should be displayed containing words like error|failed|unable|cannot 
test('handles fetch error', async () => {
  // Mock the fetch request
  global.fetch = jest.fn(() =>
    Promise.reject('API is down')
  );

  render(<App />);

  // Error Msg check
  expect(await screen.findByText(/(error|failed|unable|cannot)/i)).toBeInTheDocument();

  // Restore
  global.fetch.mockRestore();
});

// test 4, unit test, whitebox, check if List component can display all the item names
test('renders items correctly', () => {
  const mockData = [
    {
      name: 'Ontario',
      capital: 'Toronto',
      flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Flag_of_Ontario.svg'
    },
    {
      name: 'Quebec',
      capital: 'Quebec City',
      flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Flag_of_Quebec.svg'
    },
  ];

  render(<List data={mockData} />);

  // Check that the item name are displayed correctly
  mockData.forEach(item => {
    expect(screen.getByText(item.name)).toBeInTheDocument();
  });
});

// test 5, unit test, blackbox/whitebox, check if when img src is broken, there is any placeholder imgs
test('handles image loading error', () => {
  // use global API to imitate image failure
  global.Image = class extends Image {
    constructor() {
      super();
      this.onerror = null;
    }
    set src(value) {
      // trigger the error
      if (this.onerror) {
        this.onerror();
      }
    }
  };

  const item = {
    name: 'Ontario',
    capital: 'Toronto',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Flag_of_Ontario.svg'
  };

  render(<Item {...item} />);

  const flagImage = screen.getByAltText(`${item.name}'s Flag`);
  expect(flagImage).toBeInTheDocument();

  // if img loarding failed for the original src, it should be replaced by a backup src
  const originalSrc = flagImage.src;

  fireEvent.error(flagImage);

  // check that the src attribute has changed or not
  expect(flagImage.src).not.toBe(originalSrc);
});
