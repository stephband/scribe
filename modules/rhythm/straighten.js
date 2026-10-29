
/**
straighten(data)
Straightens out swing rhythms - any `4` or `5` rhythms with divisor `3`.
**/
export default function straighten(data) {
    if (data.divisor === 3) {
        switch (data.rhythm) {
            case 4:
                data.divisor = 2;
                data.rhythm  = 2;
                break;
            case 5:
                data.divisor = 2;
                data.rhythm  = 3;
                break;
            //default:
            //    console.log('Unstraightened data', data.rhythm, data);
        }
    }

    return data;
}
