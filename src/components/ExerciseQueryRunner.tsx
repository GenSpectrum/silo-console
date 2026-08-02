import { useMemo } from 'react';
import { remoteQueryTarget } from '../lib/queryTarget';
import QueryRunner from './QueryRunner';

type ExerciseQueryRunnerProps = {
    server: string;
    referenceQuery: string;
};

export default function ExerciseQueryRunner({ server, referenceQuery }: ExerciseQueryRunnerProps) {
    const target = useMemo(() => remoteQueryTarget(server), [server]);
    return <QueryRunner target={target} referenceQuery={referenceQuery} />;
}
