import {useCallback, useState, Dispatch, SetStateAction} from 'react';
import produce from 'immer';

export const useProduceState = <S>(
  initialState: S,
): [S, Dispatch<SetStateAction<S>>] => {
  const [state, setState] = useState(initialState);
  const produceState = useCallback(
    (producer) => {
      setState((currentState) => produce(currentState, producer) as S);
    },
    [setState],
  );
  return [state, produceState];
};
