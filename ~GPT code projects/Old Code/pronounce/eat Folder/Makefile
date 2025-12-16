
# For gcc
CC= gcc
# For ANSI compilers
#CC= cc

#For Optimization
#CFLAGS= -O2
#For debugging
CFLAGS= -g

RM= /bin/rm -f
#--- You shouldn't have to edit anything else. ---

.c.o: 
        $(CC) -c $(CFLAGS) $<

all: eat-server

sun:
        make all CC=gcc

eat-server: eat-server.o util.o
        $(CC) eat-server.o util.o -o eat-server
