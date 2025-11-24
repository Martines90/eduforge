import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCascadingSelect } from '@/lib/hooks/useCascadingSelect';
import { NavigationTopic } from '@/types/navigation';

describe('useCascadingSelect Hook', () => {
  const mockData: NavigationTopic[] = [
    {
      name: 'Mathematics',
      sub_topics: [
        {
          name: 'Algebra',
          sub_topics: [
            { name: 'Linear Equations' },
            { name: 'Quadratic Equations' },
          ],
        },
        { name: 'Geometry' },
      ],
    },
    { name: 'Physics' },
  ];

  it('initializes with empty selection', () => {
    const { result } = renderHook(() => useCascadingSelect({ data: mockData }));

    expect(result.current.selectionPath).toEqual([]);
    expect(result.current.availableOptions).toHaveLength(1);
    expect(result.current.availableOptions[0]).toEqual(mockData);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.finalSelection).toBeNull();
  });

  it('selects first level option and updates available options', () => {
    const { result } = renderHook(() => useCascadingSelect({ data: mockData }));

    act(() => {
      result.current.selectOption(0, 'Mathematics');
    });

    expect(result.current.selectionPath).toHaveLength(1);
    expect(result.current.selectionPath[0].displayName).toBe('Mathematics');
    expect(result.current.availableOptions).toHaveLength(2);
    expect(result.current.availableOptions[1]).toEqual(mockData[0].sub_topics);
  });

  it('selects multiple levels', () => {
    const { result } = renderHook(() => useCascadingSelect({ data: mockData }));

    act(() => {
      result.current.selectOption(0, 'Mathematics');
    });

    act(() => {
      result.current.selectOption(1, 'Algebra');
    });

    expect(result.current.selectionPath).toHaveLength(2);
    expect(result.current.selectionPath[1].displayName).toBe('Algebra');
    expect(result.current.availableOptions).toHaveLength(3);
  });

  it('detects completion when no more sub_topics', () => {
    const { result } = renderHook(() => useCascadingSelect({ data: mockData }));

    act(() => {
      result.current.selectOption(0, 'Physics');
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.finalSelection?.name).toBe('Physics');
  });

  it('resets selection path from specific level', () => {
    const { result } = renderHook(() => useCascadingSelect({ data: mockData }));

    act(() => {
      result.current.selectOption(0, 'Mathematics');
    });

    act(() => {
      result.current.selectOption(1, 'Algebra');
    });

    expect(result.current.selectionPath).toHaveLength(2);

    act(() => {
      result.current.resetFrom(1);
    });

    expect(result.current.selectionPath).toHaveLength(1);
    expect(result.current.selectionPath[0].displayName).toBe('Mathematics');
  });

  it('resets entire selection', () => {
    const { result } = renderHook(() => useCascadingSelect({ data: mockData }));

    act(() => {
      result.current.selectOption(0, 'Mathematics');
    });

    act(() => {
      result.current.selectOption(1, 'Algebra');
    });

    expect(result.current.selectionPath).toHaveLength(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectionPath).toHaveLength(0);
    expect(result.current.finalSelection).toBeNull();
  });
});
