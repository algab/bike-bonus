import React, { Component } from 'react';
import { Container, Content, Header, Left, Right, Title, List, ListItem, Body, Text, Thumbnail } from 'native-base';
import { format } from 'date-fns';
import '@firebase/firestore';

import firebase from '../../services/firebase';

export default class History extends Component {
    state = {
        runs: []
    };

    async componentDidMount() {
        firebase.firestore().collection('runs').orderBy('begin').get()
            .then(snapshot => {
                const runs = [];
                snapshot.forEach(doc => {
                    if (doc.data().end !== null) {
                        runs.push({ ...doc.data(), id: doc.id });
                    }
                });
                this.setState({ runs });
            });
    }

    render() {
        const { runs } = this.state;
        const { navigation } = this.props;
        return (
            <Container>
                <Header style={{ backgroundColor: '#4C4CFF' }}>
                    <Left>
                        <Title>Histórico</Title>
                    </Left>
                    <Right />
                </Header>
                <Content>
                    <List>
                        {
                            runs.map(data => (
                                <ListItem avatar key={data.id} button={true} onPress={() => navigation.navigate('Way', { id: data.id })}>
                                    <Left>
                                        <Thumbnail source={require('../../../assets/map.png')} />
                                    </Left>
                                    <Body>
                                        <Text>Data: {format(data.begin, 'dd/MM/yyyy')}</Text>
                                        <Text note>Hora da Partida: {format(data.begin, 'HH:mm')}</Text>
                                        <Text note>Hora da Chegada: {format(data.end, 'HH:mm')}</Text>
                                        <Text note>Distância: {data.distance} KM</Text>
                                    </Body>
                                </ListItem>
                            ))
                        }
                    </List>
                </Content>
            </Container>
        )
    }
};
