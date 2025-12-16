#include <stdio.h>#include <stdlib.h>#include <string.h>#define kMaxChars	48#define kNumWords	4380struct words{	char word[kMaxChars],pron[kMaxChars];}wordList[kNumWords],pronList[kNumWords]; int main( void ) {	long 		littleloop, searchPointer,count,c,q,d,p,max,min,result, result1, result2, lastDiff,wordc,pronc;	char 		str [255],word[255],pron[255],query[255],swappron1[255],swappron2[255],aux[255];	FILE		*pw,*wp,*output;		wp = fopen("words pron.txt", "r");	if(wp == NULL)		{			printf("\nCannot open words pron.txt\n");			exit(0);		}		pw = fopen("pron words.txt", "r");	if(pw == NULL)		{			printf("\nCannot open pron words.txt\n");			exit(0);		}	
	output = fopen("output.txt", "w");	if(output == NULL)		{			printf("\nCannot open output.txt\n");			exit(0);		}
	
	c=0;	while(!feof(wp))	//	load the words	{	//	load the words	fgets(str,kMaxChars,wp);		//	get the entry	sscanf(str,"%s",&word);			//	get the word	sscanf(&str[strlen(word)],"%s",&pron);		//	get the pronunciation	strcpy(wordList[c].word,word);	strcpy(wordList[c].pron,pron);		//	load the pronunciations	fgets(str,kMaxChars,pw);		//	get the entry	sscanf(str,"%s",&pron);			//	get the pronunciation	sscanf(&str[strlen(pron)],"%s",&word);		//	get the word	strcpy(pronList[c].pron,pron);	strcpy(pronList[c].word,word);		c++;	if (c>=kNumWords) break;	}	printf("loaded\n");		if(wp != NULL)	fclose(wp);	if(pw != NULL)	fclose(pw);		//	next word
	for(q=0;q<=kNumWords;q++)
		{			strcpy(query,wordList[q].word);			//printf("searching for %d %s\n",q,query);			//printf("%d\n",q);			//	is the word in the word list?
			strcpy(word,query);			min=0;			max=kNumWords;			searchPointer=(max-min)/2;			do{				lastDiff = min+((max-min)/2);				result = strcmp(word,wordList[searchPointer].word);				if(result<0){					max=searchPointer;					searchPointer=min+((max-min)/2);				}else					if(result>0){						min=searchPointer;						searchPointer=min+((max-min)/2);					}			}while((result!=0)&&(c!=lastDiff));						if(result==0){
				;//printf("word found\n");
				wordc=searchPointer;
			} else printf("word not found\n");
			
			//find the pron
			//	is the pron in the pron list?
			strcpy(pron,wordList[wordc].pron);			c=0;			do{				c++;
				result = strcmp(pron,pronList[c].pron);			}while((result!=0)&&(c<kNumWords));			
			if(result==0){
				;//printf("pron found\n");
				pronc=c;
			} else printf("pron not found\n");
			
			//	search for spoonerisms
			for(count=0; count <kNumWords; count++){
				//	get the prons
				strcpy(swappron1,wordList[wordc].pron);
				strcpy(swappron2,wordList[count].pron);
				//swap the prons
				//printf("%s	%s\n", swappron1, swappron2);
				
				
				if(swappron1[0]!=swappron2[0]&&swappron1[1]!=swappron2[1])	//avoid same phoneme
				{ if(strlen(swappron1)>3&&strlen(swappron2)>3)	// only use pronunciations longer than three phonemes
					{
						// swap first phoneme
						/*aux[0] = swappron1[0];
						swappron1[0] = swappron2[0];
						swappron2[0] = aux[0];
						//printf("%s	%s\n\n", swappron1, swappron2);*/
						
						// swap first two phonemes
						//printf("%s	%s becomes ", swappron1, swappron2);
						aux[0] = swappron1[0];
						aux[1] = swappron1[1];
						swappron1[0] = swappron2[0];
						swappron1[1] = swappron2[1];
						swappron2[0] = aux[0];
						swappron2[1] = aux[1];
						//printf("%s	%s\n", swappron1, swappron2);
						
						// swap first phoneme, the insert the second, expanding and contracting
						//printf("%s	%s becomes ", swappron1, swappron2);
						
						//printf("pron 1 %s, %d\n",swappron1,strlen(swappron1));
						//printf("pron 2 %s, %d\n",swappron2,strlen(swappron2));
						// swap first phoneme
						/*aux[0] = swappron1[0];
						swappron1[0] = swappron2[0];
						swappron2[0] = aux[0];
						
						//printf("swapped 1 %s, %d\n",swappron1,strlen(swappron1));
						//printf("swapped 2 %s, %d\n",swappron2,strlen(swappron2));
						
						//expand second pronunciation
						for(littleloop=strlen(swappron2);littleloop>=1;littleloop--)
							swappron2[littleloop+1]=swappron2[littleloop];
						
						//insert second phoneme from 1
						swappron2[1] = swappron1[1];
						//printf("expanded 2 %s, %d\n",swappron2,strlen(swappron2));

						//contract first pronunication
						for(littleloop=1;littleloop<=strlen(swappron1);littleloop++)
							swappron1[littleloop]=swappron1[littleloop+1];
						swappron1[littleloop+2]=NULL;	// terminate new string
						//printf("contracted 1 %s, %d\n",swappron1,strlen(swappron1));
						
						//printf("%s	%s\n", swappron1, swappron2);
						*/
						// Look for first pron
						c=0;
						do{							c++;
							result1 = strcmp(swappron1,pronList[c].pron);						}while((result1!=0)&&(c<kNumWords));
						if(result1==0){
							// look for the second pron
							d=0;
							do{
								d++;
								result2=strcmp(swappron2,pronList[d].pron);				}while((result2!=0)&&(d<kNumWords));
							if(result2==0){	
								if(strcmp(wordList[q].word,pronList[d].word)!=0)	//	avoid swapped words
									{
										printf("%s %s	",wordList[q].word, wordList[count].word);
										printf("%s %s from ",pronList[c].word, pronList[d].word);
										printf("%s	%s\n", swappron1, swappron2);
									
										fprintf(output,"%s %s	",wordList[q].word, wordList[count].word);
										fprintf(output,"%s %s\n",pronList[c].word, pronList[d].word);
									}
							} else ;
						} else ;
					}
				}
			}
		}
	printf("complete\n");
	fclose(output);
	
	return 0;}